package com.yogimangchi.domain.asset.service;

import com.yogimangchi.domain.asset.repository.AssetRepository;
import com.yogimangchi.domain.asset.repository.HoldingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AssetService {

    private final AssetRepository assetRepository;
    private final HoldingRepository holdingRepository;


}
