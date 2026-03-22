package com.yogimangchi.domain.asset.repository;

import com.yogimangchi.domain.asset.entity.Holding;
import org.hibernate.type.descriptor.converter.spi.JpaAttributeConverter;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HoldingRepository extends JpaRepository<Holding, Long> {

}
