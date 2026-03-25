import axios from "axios";

export interface VietQRBank {
    id: number;
    name: string;
    code: string;
    bin: string;
    shortName: string;
    logo: string;
    transferSupported: number;
    lookupSupported: number;
    short_name: string;
    support: number;
    isTransfer: number;
    swift_code: string | null;
}

export interface VietQRBanksResponse {
    code: string;
    desc: string;
    data: VietQRBank[];
}

export const getVietQRBanks = async (): Promise<VietQRBank[]> => {
    const response = await axios.get<VietQRBanksResponse>("https://api.vietqr.io/v2/banks");
    return response.data.data;
};
