package fpt.teddypet.application.service.bookings;

import fpt.teddypet.application.dto.request.bookings.CreateBookingPetRequest;
import fpt.teddypet.application.dto.request.bookings.CreateBookingPetServiceRequest;
import fpt.teddypet.application.dto.request.bookings.CreateBookingRequest;
import fpt.teddypet.application.dto.request.bookings.PetFoodBroughtItemRequest;
import fpt.teddypet.application.dto.response.bookings.CreateBookingResponse;
import fpt.teddypet.application.port.input.bookings.BookingClientService;
import fpt.teddypet.application.port.output.room.RoomRepositoryPort;
import fpt.teddypet.application.port.output.services.ServicePricingRepositoryPort;
import fpt.teddypet.application.port.output.services.ServiceRepositoryPort;
import fpt.teddypet.application.port.output.shop.TimeSlotRepositoryPort;
import fpt.teddypet.domain.entity.Booking;
import fpt.teddypet.domain.entity.BookingPet;
import fpt.teddypet.domain.entity.BookingPetService;
import fpt.teddypet.domain.entity.BookingPetServiceItem;
import fpt.teddypet.domain.entity.PetFoodBrought;
import fpt.teddypet.domain.entity.Room;
import fpt.teddypet.domain.entity.ServicePricing;
import fpt.teddypet.domain.entity.TimeSlot;
import fpt.teddypet.domain.enums.bookings.BookingPaymentMethodEnum;
import fpt.teddypet.domain.exception.TimeSlotFullException;
import fpt.teddypet.infrastructure.persistence.postgres.repository.bookings.BookingRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.persistence.OptimisticLockException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class BookingClientApplicationService implements BookingClientService {

    private final BookingRepository bookingRepository;
    private final ServiceRepositoryPort serviceRepositoryPort;
    private final ServicePricingRepositoryPort servicePricingRepositoryPort;
    private final RoomRepositoryPort roomRepositoryPort;
    private final TimeSlotRepositoryPort timeSlotRepositoryPort;

    @Override
    public CreateBookingResponse createBooking(CreateBookingRequest request) {
        if (request.pets() == null || request.pets().isEmpty()) {
            throw new IllegalArgumentException("Vui lòng chọn ít nhất một thú cưng và dịch vụ.");
        }

        Booking booking = buildBookingEntity(request);

        BigDecimal bookingTotal = BigDecimal.ZERO;

        for (CreateBookingPetRequest petRequest : request.pets()) {
            BookingPet bookingPet = buildBookingPetEntity(booking, petRequest);
            booking.getPets().add(bookingPet);

            for (CreateBookingPetServiceRequest svcRequest : petRequest.services()) {
                BookingPetService bookingPetService = buildBookingPetServiceEntity(bookingPet, svcRequest);
                bookingPet.getServices().add(bookingPetService);

                // Pricing: resolve unit price by petType + weight, then compute subtotal
                BigDecimal unitPrice = resolveUnitPrice(
                        bookingPetService.getService(),
                        petRequest.petType(),
                        petRequest.weightAtBooking()
                );
                bookingPetService.setUnitPrice(unitPrice);

                BigDecimal subtotal = computeSubtotal(bookingPetService, unitPrice);
                bookingPetService.setSubtotal(subtotal);
                bookingTotal = bookingTotal.add(subtotal);
            }
        }

        booking.setTotalAmount(bookingTotal);
        booking.setPaidAmount(BigDecimal.ZERO);
        booking.setDeposit(BigDecimal.ZERO);
        booking.setRemainingAmount(bookingTotal);

        // Ngày bắt đầu/kết thúc booking dựa trên các dịch vụ
        LocalDateTime[] range = calculateBookingRange(booking);
        booking.setBookingStartDate(range[0]);
        booking.setBookingEndDate(range[1]);

        Booking saved = bookingRepository.save(booking);

        // Tăng currentBookings theo từng booking_pet_service (mỗi dòng dịch vụ chọn slot = +1).
        // Một booking có nhiều thú cưng cùng chọn một khung giờ → +1 cho mỗi con (mỗi bps), không phải +1 theo booking hay booking_pet.
        try {
            for (BookingPet pet : saved.getPets()) {
                for (BookingPetService bps : pet.getServices()) {
                    Long timeSlotId = bps.getTimeSlotId();
                    if (timeSlotId == null) continue;
                    TimeSlot slot = timeSlotRepositoryPort.findById(timeSlotId)
                            .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy khung giờ: " + timeSlotId));
                    int maxCap = slot.getMaxCapacity() != null ? slot.getMaxCapacity() : 1;
                    int current = slot.getCurrentBookings() != null ? slot.getCurrentBookings() : 0;
                    if (current >= maxCap) {
                        throw new TimeSlotFullException("Khung giờ đã đủ chỗ. Vui lòng làm mới trang và chọn khung giờ khác.");
                    }
                    slot.setCurrentBookings(current + 1);
                    timeSlotRepositoryPort.save(slot);
                }
            }
        } catch (OptimisticLockException e) {
            throw new TimeSlotFullException("Khung giờ vừa được đặt bởi khách khác. Vui lòng làm mới trang và chọn khung giờ khác.");
        }

        return new CreateBookingResponse(saved.getBookingCode());
    }

    private Booking buildBookingEntity(CreateBookingRequest request) {
        Booking booking = new Booking();
        booking.setId(null);
        booking.setBookingCode(generateBookingCode());
        booking.setCustomerName(request.customerName());
        booking.setCustomerEmail(request.customerEmail());
        booking.setCustomerPhone(request.customerPhone());
        booking.setBookingType(request.bookingType());
        booking.setSource("CLIENT_PORTAL");
        booking.setNote(request.note());
        booking.setSpecialRequests(request.note());
        booking.setStatus("PENDING");
        booking.setPaymentStatus("PENDING");
        booking.setPaymentMethod(BookingPaymentMethodEnum.CASH.name());
        booking.setCustomerPhone(request.customerPhone());
        booking.setCustomerEmail(request.customerEmail());
        return booking;
    }

    private BookingPet buildBookingPetEntity(Booking booking, CreateBookingPetRequest petRequest) {
        BookingPet pet = new BookingPet();
        pet.setId(null);
        pet.setBooking(booking);
        pet.setPetName(petRequest.petName());
        pet.setEmergencyContactName(petRequest.emergencyContactName());
        pet.setEmergencyContactPhone(petRequest.emergencyContactPhone());
        pet.setWeightAtBooking(petRequest.weightAtBooking());
        pet.setPetConditionNotes(petRequest.petConditionNotes());

        List<PetFoodBroughtItemRequest> foodItems = petRequest.foodItems() != null
                ? petRequest.foodItems()
                : Collections.emptyList();
        for (PetFoodBroughtItemRequest item : foodItems) {
            if (item == null) continue;
            PetFoodBrought entity = new PetFoodBrought();
            entity.setId(null);
            entity.setBookingPet(pet);
            entity.setFoodBroughtType(item.foodBroughtType());
            entity.setFoodBrand(item.foodBrand());
            entity.setQuantity(item.quantity());
            entity.setFeedingInstructions(item.feedingInstructions());
            pet.getFoodItems().add(entity);
        }
        return pet;
    }

    private BookingPetService buildBookingPetServiceEntity(BookingPet pet, CreateBookingPetServiceRequest svcRequest) {
        fpt.teddypet.domain.entity.Service service = serviceRepositoryPort.findById(svcRequest.serviceId())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy dịch vụ với id: " + svcRequest.serviceId()));

        BookingPetService entity = new BookingPetService();
        entity.setId(null);
        entity.setBookingPet(pet);
        entity.setService(service);

        boolean requiresRoom = Boolean.TRUE.equals(service.getIsRequiredRoom()) || svcRequest.requiresRoom();
        if (requiresRoom) {
            if (svcRequest.checkInDate() != null && !svcRequest.checkInDate().isBlank()) {
                entity.setEstimatedCheckInDate(LocalDate.parse(svcRequest.checkInDate()));
            }
            if (svcRequest.checkOutDate() != null && !svcRequest.checkOutDate().isBlank()) {
                entity.setEstimatedCheckOutDate(LocalDate.parse(svcRequest.checkOutDate()));
            }
            if (svcRequest.roomId() != null) {
                Room room = roomRepositoryPort.findById(svcRequest.roomId())
                        .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy phòng với id: " + svcRequest.roomId()));
                entity.setRoomId(room.getId());
            }
        } else {
            // Dịch vụ không yêu cầu phòng: ngày hẹn -> estimatedCheckInDate; estimatedCheckOutDate xử lý logic sau
            String dateStr = (svcRequest.sessionDate() != null && !svcRequest.sessionDate().isBlank())
                    ? svcRequest.sessionDate()
                    : svcRequest.checkInDate();
            if (dateStr != null && !dateStr.isBlank()) {
                LocalDate date = LocalDate.parse(dateStr);
                entity.setEstimatedCheckInDate(date);
                if (svcRequest.sessionSlotLabel() != null && svcRequest.sessionSlotLabel().contains("-")) {
                    String[] parts = svcRequest.sessionSlotLabel().split("-");
                    String start = parts[0].trim();
                    String end = parts[1].trim();
                    DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm");
                    try {
                        entity.setScheduledStartTime(LocalDateTime.of(date, java.time.LocalTime.parse(start, timeFormatter)));
                        entity.setScheduledEndTime(LocalDateTime.of(date, java.time.LocalTime.parse(end, timeFormatter)));
                    } catch (Exception ignored) {
                        // Nếu parse lỗi, bỏ qua, vẫn lưu booking bình thường
                    }
                }
            }
            if (svcRequest.timeSlotId() != null) {
                entity.setTimeSlotId(svcRequest.timeSlotId());
            }
        }

        entity.setStatus("PENDING");

        // Add-on items (chỉ chấp nhận dịch vụ isAddon=true)
        for (Long addonId : svcRequest.addonServiceIds()) {
            if (addonId == null) continue;
            fpt.teddypet.domain.entity.Service addonService = serviceRepositoryPort.findById(addonId).orElse(null);
            if (addonService == null || !Boolean.TRUE.equals(addonService.getIsAddon())) continue;
            BookingPetServiceItem item = new BookingPetServiceItem();
            item.setBookingPetService(entity);
            item.setParentServiceId(service.getId());
            item.setItemService(addonService);
            item.setItemType("ADDON");
            entity.getItems().add(item);
        }

        return entity;
    }

    private BigDecimal computeSubtotal(BookingPetService bookingPetService, BigDecimal unitPrice) {
        if (unitPrice == null) {
            unitPrice = BigDecimal.ZERO;
        }

        boolean requiredRoom = bookingPetService.getService() != null
                && Boolean.TRUE.equals(bookingPetService.getService().getIsRequiredRoom());

        if (!requiredRoom) {
            bookingPetService.setNumberOfNights(null);
            return unitPrice;
        }

        LocalDate checkIn = bookingPetService.getEstimatedCheckInDate();
        LocalDate checkOut = bookingPetService.getEstimatedCheckOutDate();
        if (checkIn == null || checkOut == null) {
            throw new IllegalArgumentException("Dịch vụ yêu cầu phòng phải có check-in và check-out.");
        }
        if (!checkOut.isAfter(checkIn)) {
            throw new IllegalArgumentException("Ngày trả phải sau ngày gửi (không được bằng hoặc nhỏ hơn).");
        }

        long nights = ChronoUnit.DAYS.between(checkIn, checkOut);
        if (nights < 1) nights = 1;
        bookingPetService.setNumberOfNights((int) nights);

        return unitPrice.multiply(BigDecimal.valueOf(nights));
    }

    /**
     * Resolve correct price by service pricing rules based on pet type + weight.
     *
     * Rule matching:
     * - Only active pricing rules are considered.
     * - If suitablePetTypes is empty -> matches all pet types.
     * - If weight is provided -> must be within [minWeight, maxWeight] (null min/max means open-ended).
     * - If weight is missing -> prefers rules without weight constraints; falls back to any pet-type-matching rule.
     * - Chooses the best candidate by priority DESC, then more specific weight constraints, then narrower range.
     */
    private BigDecimal resolveUnitPrice(fpt.teddypet.domain.entity.Service service, String petTypeRaw, BigDecimal petWeight) {
        if (service == null || service.getId() == null) {
            return BigDecimal.ZERO;
        }

        List<ServicePricing> rules = servicePricingRepositoryPort.findByServiceIdAndActive(service.getId(), true);
        if (rules == null || rules.isEmpty()) {
            return service.getBasePrice() != null ? service.getBasePrice() : BigDecimal.ZERO;
        }

        String petTypeKey = normalizePetType(petTypeRaw);
        LocalDateTime now = LocalDateTime.now();

        List<ServicePricing> eligible = new ArrayList<>();
        for (ServicePricing r : rules) {
            if (r == null || r.getPrice() == null) continue;

            if (r.getEffectiveFrom() != null && r.getEffectiveFrom().isAfter(now)) continue;
            if (r.getEffectiveTo() != null && r.getEffectiveTo().isBefore(now)) continue;

            if (!matchesPetType(r.getSuitablePetTypes(), petTypeKey)) continue;

            if (petWeight == null) {
                // If pet weight is unknown, only accept "no weight constraint" rules.
                if (r.getMinWeight() != null || r.getMaxWeight() != null) continue;
            } else if (!matchesWeight(r.getMinWeight(), r.getMaxWeight(), petWeight)) {
                continue;
            }

            eligible.add(r);
        }

        ServicePricing best = eligible.stream()
                .sorted(bestPricingComparator())
                .findFirst()
                .orElse(null);

        if (best == null || best.getPrice() == null) {
            return service.getBasePrice() != null ? service.getBasePrice() : BigDecimal.ZERO;
        }
        return best.getPrice();
    }

    private Comparator<ServicePricing> bestPricingComparator() {
        return Comparator
                // lower priority number first (consistent with FE ordering)
                .comparing((ServicePricing r) -> r.getPriority() != null ? r.getPriority() : 0)
                // more weight constraints -> more specific
                .thenComparing(r -> weightSpecificityScore(r.getMinWeight(), r.getMaxWeight()), Comparator.reverseOrder())
                // prefer higher minWeight (more specific for heavier pets)
                .thenComparing(r -> r.getMinWeight() != null ? r.getMinWeight() : BigDecimal.valueOf(-1), Comparator.reverseOrder())
                // prefer lower maxWeight (narrower upper bound)
                .thenComparing(r -> r.getMaxWeight() != null ? r.getMaxWeight() : BigDecimal.valueOf(Double.MAX_VALUE));
    }

    private int weightSpecificityScore(BigDecimal min, BigDecimal max) {
        int s = 0;
        if (min != null) s++;
        if (max != null) s++;
        return s;
    }

    private boolean matchesWeight(BigDecimal minWeight, BigDecimal maxWeight, BigDecimal petWeight) {
        if (petWeight == null) return true;
        if (minWeight != null && petWeight.compareTo(minWeight) < 0) return false;
        if (maxWeight != null && petWeight.compareTo(maxWeight) > 0) return false;
        return true;
    }

    private boolean matchesPetType(String suitablePetTypes, String petTypeKey) {
        if (petTypeKey == null || petTypeKey.isBlank()) return true;
        if (suitablePetTypes == null || suitablePetTypes.isBlank()) return true;

        String trimmed = suitablePetTypes.trim();
        // Accept JSON array format (["DOG","CAT"]) or CSV ("DOG,CAT")
        if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
            // very small parser (avoid ObjectMapper dependency here)
            String inner = trimmed.substring(1, trimmed.length() - 1).trim();
            if (inner.isBlank()) return true;
            String[] parts = inner.split(",");
            for (String p : parts) {
                String v = p == null ? "" : p.trim();
                v = v.replace("\"", "").replace("'", "").trim();
                if (v.equalsIgnoreCase(petTypeKey)) return true;
            }
            return false;
        }

        String[] parts = trimmed.split(",");
        for (String p : parts) {
            String v = p == null ? "" : p.trim();
            if (v.isEmpty()) continue;
            if (v.equalsIgnoreCase(petTypeKey)) return true;
        }
        return false;
    }

    private String normalizePetType(String petTypeRaw) {
        if (petTypeRaw == null) return "OTHER";
        String v = petTypeRaw.trim();
        if (v.isEmpty()) return "OTHER";
        // Client sends "dog"/"cat"/"other" or enum-like values
        String upper = v.toUpperCase(Locale.ENGLISH);
        return switch (upper) {
            case "DOG", "CAT", "OTHER" -> upper;
            case "CHO" -> "DOG";
            case "MEO" -> "CAT";
            default -> "OTHER";
        };
    }

    private LocalDateTime[] calculateBookingRange(Booking booking) {
        LocalDateTime min = null;
        LocalDateTime max = null;

        for (BookingPet pet : booking.getPets()) {
            for (BookingPetService svc : pet.getServices()) {
                LocalDateTime start = null;
                LocalDateTime end = null;

                if (svc.getEstimatedCheckInDate() != null) {
                    start = svc.getEstimatedCheckInDate().atStartOfDay();
                }
                if (svc.getScheduledStartTime() != null) {
                    start = svc.getScheduledStartTime();
                }

                if (svc.getEstimatedCheckOutDate() != null) {
                    end = svc.getEstimatedCheckOutDate().atTime(23, 59);
                }
                if (svc.getScheduledEndTime() != null) {
                    end = svc.getScheduledEndTime();
                }

                if (start != null) {
                    min = (min == null || start.isBefore(min)) ? start : min;
                }
                if (end != null) {
                    max = (max == null || end.isAfter(max)) ? end : max;
                }
            }
        }

        if (min == null) {
            min = LocalDateTime.now();
        }
        if (max == null) {
            max = min;
        }
        return new LocalDateTime[]{min, max};
    }

    private String generateBookingCode() {
        LocalDateTime now = LocalDateTime.now();
        String datePart = now.format(DateTimeFormatter.ofPattern("yyMMdd"));
        String randomPart = UUID.randomUUID().toString().replace("-", "").substring(0, 5).toUpperCase();
        return "BK-" + datePart + "-" + randomPart;
    }
}

