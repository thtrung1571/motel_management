const { PriceLogic } = require('../models');
const AppError = require('../utils/appError');

class PriceCalculationService {
  constructor(priceLogic) {
    this.priceLogic = priceLogic;
  }

  static async initialize() {
    const priceLogic = await PriceLogic.findOne();
    if (!priceLogic) {
      throw new Error('Không tìm thấy cấu hình tính giá');
    }
    return new PriceCalculationService(priceLogic);
  }

  isWithinHalfDayTime(time) {
    const hour = new Date(time).getHours();
    return hour >= this.priceLogic.halfDayStart && hour <= this.priceLogic.halfDayEnd;
  }

  calculateHalfDayCharge(durationHours, roomPrices, rentType, hasWarning = false, warningDetails = null, checkInTime, checkOutTime) {
    // Case 3: Thời gian thuê nằm trong khung giờ halfday
    if (this.isWithinHalfDayTime(checkInTime) && this.isWithinHalfDayTime(checkOutTime)) {
      const baseCharge = {
        type: 'halfday',
        amount: roomPrices.halfDayPrice || 0,
        details: {
          basePrice: roomPrices.halfDayPrice || 0,
          total: roomPrices.halfDayPrice || 0
        }
      };

      // Tính phụ phí nếu vượt giờ
      if (durationHours > this.priceLogic.maxHalfDayHours) {
        const extraHours = durationHours - this.priceLogic.maxHalfDayHours;
        const extraCharge = extraHours * (roomPrices.additionalHourPrice || 0);
        baseCharge.amount += extraCharge;
        baseCharge.details.extraHours = {
          hours: extraHours,
          pricePerHour: roomPrices.additionalHourPrice || 0,
          total: extraCharge
        };
        baseCharge.details.total = baseCharge.amount;

        // Thêm cảnh báo nếu gần đến ngưỡng overnight
        if (!hasWarning) {
          return {
            ...baseCharge,
            warning: 'rentype_threshold',
            suggestedType: 'overnight',
            suggestedPrice: roomPrices.fullDayPrice || 0,
            warningMessage: 'Thời gian thuê đã vượt quá ngưỡng nửa ngày, nên chuyển sang tính nguyên ngày'
          };
        }
      }

      return baseCharge;
    }

    // Case 2: Đã vượt ngưỡng overnight và có cảnh báo
    if (durationHours >= this.priceLogic.maxHalfDayHours && hasWarning) {
      return {
        type: 'overnight',
        amount: roomPrices.fullDayPrice || 0,
        details: {
          basePrice: roomPrices.fullDayPrice || 0,
          total: roomPrices.fullDayPrice || 0
        },
        autoChanged: true,
        previousType: 'halfday',
        changedTo: 'overnight'
      };
    }

    // Case 1: Ngoài khung giờ halfday
    const baseCharge = {
      type: 'halfday',
      amount: roomPrices.halfDayPrice || 0,
      details: {
        basePrice: roomPrices.halfDayPrice || 0,
        total: roomPrices.halfDayPrice || 0
      }
    };

    // Tính phụ phí nếu vượt maxHalfDayHours
    if (durationHours > this.priceLogic.maxHalfDayHours) {
      const extraHours = durationHours - this.priceLogic.maxHalfDayHours;
      const extraCharge = extraHours * (roomPrices.additionalHourPrice || 0);
      baseCharge.amount += extraCharge;
      baseCharge.details.extraHours = {
        hours: extraHours,
        pricePerHour: roomPrices.additionalHourPrice || 0,
        total: extraCharge
      };
      baseCharge.details.total = baseCharge.amount;

      // Thêm cảnh báo nếu chưa có
      if (!hasWarning) {
        return {
          ...baseCharge,
          warning: 'rentype_threshold',
          suggestedType: 'overnight',
          suggestedPrice: roomPrices.fullDayPrice || 0,
          warningMessage: 'Thời gian thuê đã vượt quá ngưỡng nửa ngày, nên chuyển sang tính nguyên ngày'
        };
      }
    }

    return baseCharge;
  }

  calculateHourlyCharge(durationHours, roomPrices, rentType, hasWarning = false, warningDetails = null) {
    // Xử lý rentType hourly
    if (rentType === 'hourly') {
      // Case 4: Đã có cảnh báo và vượt ngưỡng giờ -> chuyển sang nửa ngày
      if (hasWarning && 
          warningDetails?.suggestedType === 'halfday' &&
          durationHours > this.priceLogic.hourlyThreshold && 
          durationHours <= this.priceLogic.maxHalfDayHours) {
        return {
          ...this.calculateHalfDayCharge(durationHours, roomPrices),
          autoChanged: true,
          previousType: 'hourly',
          changedTo: 'halfday'
        };
      }

      // Case 5: Đã có cảnh báo và vượt ngưỡng nửa ngày -> chuyển sang nguyên ngày
      if (hasWarning && 
          warningDetails?.suggestedType === 'overnight' &&
          durationHours > this.priceLogic.maxHalfDayHours && 
          durationHours <= this.priceLogic.maxFullDayHours) {
        return {
          ...this.calculateOvernightCharge(durationHours, roomPrices),
          autoChanged: true,
          previousType: 'hourly',
          changedTo: 'overnight'
        };
      }

      // Case 1: Dưới ngưỡng giờ
      if (durationHours <= this.priceLogic.hourlyThreshold) {
        return this.calculateBasicHourlyRate(durationHours);
      }

      // Case 2: Vượt ngưỡng giờ nhưng chưa đến nửa ngày -> cảnh báo
      if (durationHours > this.priceLogic.hourlyThreshold && 
          durationHours <= this.priceLogic.maxHalfDayHours) {
        const hourlyCharge = this.calculateBasicHourlyRate(durationHours);
        return {
          ...hourlyCharge,
          warning: 'rentype_threshold',
          suggestedType: 'halfday',
          suggestedPrice: roomPrices.halfDayPrice,
          warningMessage: 'Thời gian thuê đã vượt quá ngưỡng tính giờ, nên chuyển sang tính nửa ngày'
        };
      }

      // Case 3: Vượt ngưỡng nửa ngày nhưng chưa đến nguyên ngày -> cảnh báo
      if (durationHours > this.priceLogic.maxHalfDayHours && 
          durationHours <= this.priceLogic.maxFullDayHours) {
        const hourlyCharge = this.calculateBasicHourlyRate(durationHours);
        return {
          ...hourlyCharge,
          warning: 'rentype_threshold',
          suggestedType: 'overnight',
          suggestedPrice: roomPrices.fullDayPrice,
          warningMessage: 'Thời gian thuê đã vượt quá ngưỡng nửa ngày, nên chuyển sang tính nguyên ngày'
        };
      }
    }

    return null;
  }

  calculateBasicHourlyRate(durationHours) {
    // Tính giá giờ đầu tiên
    if (durationHours <= 1) {
      return {
        type: 'hourly_base',
        amount: this.priceLogic.baseHourPrice,
        details: {
          hours: 1,
          basePrice: this.priceLogic.baseHourPrice,
          total: this.priceLogic.baseHourPrice
        }
      };
    }

    // Tính giá các giờ tiếp theo
    const additionalHours = Math.ceil(durationHours - 1);
    const additionalCharge = additionalHours * this.priceLogic.additionalHourPrice;
    const total = this.priceLogic.baseHourPrice + additionalCharge;

    return {
      type: 'hourly_mixed',
      amount: total,
      details: {
        firstHour: { 
          price: this.priceLogic.baseHourPrice 
        },
        additionalHours: {
          hours: additionalHours,
          pricePerHour: this.priceLogic.additionalHourPrice,
          total: additionalCharge
        },
        total
      }
    };
  }

  calculateExtraHourCharge(extraHours, roomPrices) {
    // Nếu số giờ phụ trội <= hourlyThreshold
    if (extraHours <= this.priceLogic.hourlyThreshold) {
      return {
        type: 'hourly',
        hours: extraHours,
        pricePerHour: roomPrices.additionalHourPrice,
        total: extraHours * roomPrices.additionalHourPrice
      };
    }
    
    // Nếu số giờ phụ trội nằm trong khoảng halfday
    if (extraHours > this.priceLogic.hourlyThreshold && 
        extraHours <= this.priceLogic.maxHalfDayHours) {
      return {
        type: 'halfday',
        hours: extraHours,
        price: roomPrices.halfDayPrice,
        total: roomPrices.halfDayPrice
      };
    }
    
    // Nếu số giờ phụ trội nằm trong khoảng overnight
    if (extraHours > this.priceLogic.maxHalfDayHours && 
        extraHours <= this.priceLogic.maxFullDayHours) {
      return {
        type: 'overnight',
        hours: extraHours,
        price: roomPrices.fullDayPrice,
        total: roomPrices.fullDayPrice
      };
    }

    // Nếu vượt quá maxFullDayHours, tính thành số ngày + số giờ lẻ
    const fullDays = Math.floor(extraHours / 24);
    const remainingHours = extraHours % 24;
    
    const fullDaysCharge = fullDays * roomPrices.fullDayPrice;
    const remainingCharge = this.calculateExtraHourCharge(remainingHours, roomPrices);

    return {
      type: 'mixed',
      fullDays: {
        days: fullDays,
        pricePerDay: roomPrices.fullDayPrice,
        total: fullDaysCharge
      },
      remainingHours: remainingCharge,
      total: fullDaysCharge + remainingCharge.total
    };
  }

  calculateOvernightCharge(durationHours, roomPrices) {
    const fullDays = Math.floor(durationHours / 24);
    const remainingHours = durationHours % 24;

    const baseCharge = {
      type: 'overnight',
      amount: roomPrices.fullDayPrice || 0,
      details: {
        basePrice: roomPrices.fullDayPrice || 0,
        days: 1,
        total: roomPrices.fullDayPrice || 0
      }
    };

    // Chỉ tính phụ thu khi vượt quá 24h
    if (fullDays >= 1) {
      // Tính phụ thu cho số giờ vượt quá 24h
      if (remainingHours > 0) {
        let extraCharge = 0;
        
        if (remainingHours <= this.priceLogic.hourlyThreshold) {
          // <= 10 giờ: tính theo giờ
          extraCharge = remainingHours * (roomPrices.additionalHourPrice || 0);
          baseCharge.details.extraHours = {
            type: 'hourly',
            hours: remainingHours,
            pricePerHour: roomPrices.additionalHourPrice || 0,
            total: extraCharge
          };
        } else if (remainingHours <= 14) {
          // 10-14 giờ: tính nửa ngày
          extraCharge = roomPrices.halfDayPrice || 0;
          baseCharge.details.extraHours = {
            type: 'halfday',
            hours: remainingHours,
            price: roomPrices.halfDayPrice || 0,
            total: extraCharge
          };
        } else if (remainingHours < 17) {
          // 14-17 giờ: tính nửa ngày + giờ phụ trội
          const extraHours = remainingHours - 14;
          extraCharge = (roomPrices.halfDayPrice || 0) + (extraHours * (roomPrices.additionalHourPrice || 0));
          baseCharge.details.extraHours = {
            type: 'halfday_plus',
            halfDayHours: 14,
            halfDayPrice: roomPrices.halfDayPrice || 0,
            extraHours: {
              hours: extraHours,
              pricePerHour: roomPrices.additionalHourPrice || 0,
              total: extraHours * (roomPrices.additionalHourPrice || 0)
            },
            total: extraCharge
          };
        } else {
          // >= 17 giờ: tính thêm một ngày
          extraCharge = roomPrices.fullDayPrice || 0;
          baseCharge.details.extraHours = {
            type: 'overnight',
            hours: remainingHours,
            price: roomPrices.fullDayPrice || 0,
            total: extraCharge
          };
        }

        baseCharge.amount += extraCharge;
        baseCharge.details.total = baseCharge.amount;
      }
    } else {
      // Chưa đủ 24h thì chỉ hiển thị thông tin giờ phụ trội nhưng không tính phí
      if (remainingHours > 0) {
        baseCharge.details.extraHours = {
          type: 'overnight',
          hours: remainingHours,
          price: roomPrices.fullDayPrice || 0,
          total: 0
        };
      }
    }

    return baseCharge;
  }

  calculateCharge(checkInTime, checkOutTime, rentType, roomTypeId) {
    // Tính số giờ và phút
    const duration = checkOutTime - new Date(checkInTime);
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    
    // Làm tròn thời gian da vào ngưỡng 10 phút
    let durationHours = hours;
    if (minutes > 10) {
      durationHours += 1;
    }

    // Parse roomPrices và lấy giá phòng
    const parsedRoomPrices = typeof this.priceLogic.roomPrices === 'string' 
      ? JSON.parse(this.priceLogic.roomPrices) 
      : this.priceLogic.roomPrices;

    if (!parsedRoomPrices[roomTypeId]) {
      throw new Error('Không tìm thấy cấu hình giá cho loại phòng này');
    }

    const roomPrices = {
      hourlyPrice: this.priceLogic.baseHourPrice || 0,
      additionalHourPrice: this.priceLogic.additionalHourPrice || 0,
      fullDayPrice: parsedRoomPrices[roomTypeId].fullDayPrice || 0,
      halfDayPrice: parsedRoomPrices[roomTypeId].halfDayPrice || 0
    };

    let result;
    switch (rentType) {
      case 'hourly':
        result = this.calculateHourlyCharge(durationHours, roomPrices, rentType);
        break;
      case 'halfday':
        result = this.calculateHalfDayCharge(durationHours, roomPrices, rentType, false, null, checkInTime, checkOutTime);
        break;
      case 'overnight':
        result = this.calculateOvernightCharge(durationHours, roomPrices);
        break;
      default:
        throw new Error('Loại thuê phòng không hợp lệ');
    }

    return {
      ...result,
      checkInTime,
      checkOutTime,
      rentType,
      duration: {
        hours,
        minutes
      }
    };
  }

  async estimateCalculation(rentType, roomTypeId) {
    try {
      // Parse roomPrices nếu là string
      const parsedRoomPrices = typeof this.priceLogic.roomPrices === 'string' 
        ? JSON.parse(this.priceLogic.roomPrices) 
        : this.priceLogic.roomPrices;

      if (!parsedRoomPrices[roomTypeId]) {
        throw new Error('Không tìm thấy cấu hình giá cho loại phòng này');
      }

      const roomPrices = parsedRoomPrices[roomTypeId];
      let estimate = {
        basePrice: 0,
        additionalPrice: 0,
        estimatedCheckout: null,
        note: ''
      };

      switch (rentType) {
        case 'hourly':
          estimate = {
            basePrice: this.priceLogic.baseHourPrice,
            additionalPrice: this.priceLogic.additionalHourPrice,
            estimatedCheckout: null,
            note: `${this.priceLogic.baseHourPrice.toLocaleString('vi-VN')}đ/giờ đầu, ${this.priceLogic.additionalHourPrice.toLocaleString('vi-VN')}đ/giờ tiếp theo`
          };
          break;

        case 'halfday':
          const halfDayCheckout = new Date();
          halfDayCheckout.setHours(halfDayCheckout.getHours() + this.priceLogic.maxHalfDayHours);
          
          estimate = {
            basePrice: roomPrices.halfDayPrice,
            additionalPrice: this.priceLogic.additionalHourPrice,
            estimatedCheckout: halfDayCheckout,
            note: `${roomPrices.halfDayPrice.toLocaleString('vi-VN')}đ - Thời gian sử dụng ${this.priceLogic.maxHalfDayHours} tiếng (${this.priceLogic.halfDayStart}h - ${this.priceLogic.halfDayEnd}h)`
          };
          break;

        case 'overnight':
          const checkoutTime = new Date();
          checkoutTime.setDate(checkoutTime.getDate() + 1);
          checkoutTime.setHours(12, 0, 0, 0);

          estimate = {
            basePrice: roomPrices.fullDayPrice,
            additionalPrice: 0,
            estimatedCheckout: checkoutTime,
            note: `${roomPrices.fullDayPrice.toLocaleString('vi-VN')}đ - Trả phòng trước 12h trưa hôm sau`
          };
          break;

        default:
          throw new Error('Hình thức thuê không hợp lệ');
      }

      return {
        status: 'success',
        data: estimate
      };

    } catch (error) {
      throw new Error(error.message || 'Lỗi tính toán giá');
    }
  }

  // ... giữ nguyên các method khác ...
}

module.exports = PriceCalculationService;