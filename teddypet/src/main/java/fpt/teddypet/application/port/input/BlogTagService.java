package fpt.teddypet.application.port.input;

import fpt.teddypet.application.dto.request.blog.tag.BlogTagUpsertRequest;
import fpt.teddypet.application.dto.response.blog.tag.BlogTagInfo;
import fpt.teddypet.application.dto.response.blog.tag.BlogTagResponse;
import fpt.teddypet.domain.entity.BlogTag;

import java.util.List;

public interface BlogTagService {
    BlogTagResponse upsert(BlogTagUpsertRequest request);
    
    BlogTagResponse getTagDetail(Long id);
    
    BlogTag getById(Long id);
    
    List<BlogTagResponse> getAll();
    
    void delete(Long id);
    
    BlogTagInfo toInfo(BlogTag tag);
    
    List<BlogTagInfo> toInfos(List<BlogTag> tags);
}
