// const advertisementService = require("../services/advertisementService");

// const advertisementController = {
//   getAllAdvertisements: async (req, res) => {
//     try {
//       const advertisements = await advertisementService.getAllAdvertisements(req.query);
//       res.status(200).json({ success: true, data: advertisements });
//     } catch (error) {
//       res.status(500).json({ success: false, message: error.message });
//     }
//   },

//   getAdvertisementById: async (req, res) => {
//     try {
//       const advertisement = await advertisementService.getAdvertisementById(req.params.id);
//       if (!advertisement) {
//         return res.status(404).json({ success: false, message: "Advertisement not found" });
//       }
//       res.status(200).json({ success: true, data: advertisement });
//     } catch (error) {
//       res.status(500).json({ success: false, message: error.message });
//     }
//   },

//   createAdvertisement: async (req, res) => {
//     try {
//       const newAd = await advertisementService.createAdvertisement(req.body);
//       res.status(201).json({ success: true, data: newAd });
//     } catch (error) {
//       res.status(400).json({ success: false, message: error.message });
//     }
//   },

//   updateAdvertisement: async (req, res) => {
//     try {
//       const updatedAd = await advertisementService.updateAdvertisement(req.params.id, req.body);
//       if (!updatedAd) {
//         return res.status(404).json({ success: false, message: "Advertisement not found" });
//       }
//       res.status(200).json({ success: true, data: updatedAd });
//     } catch (error) {
//       res.status(400).json({ success: false, message: error.message });
//     }
//   },

//   deleteAdvertisement: async (req, res) => {
//     try {
//       const deletedAd = await advertisementService.deleteAdvertisement(req.params.id);
//       if (!deletedAd) {
//         return res.status(404).json({ success: false, message: "Advertisement not found" });
//       }
//       res.status(200).json({ success: true, message: "Advertisement deleted successfully" });
//     } catch (error) {
//       res.status(500).json({ success: false, message: error.message });
//     }
//   },

//   getSuppliers: async (req, res) => {
//     try {
//       const suppliers = await advertisementService.getSuppliers(req.query.search);
//       res.status(200).json({ success: true, data: suppliers });
//     } catch (error) {
//       res.status(500).json({ success: false, message: error.message });
//     }
//   },

//   getSupplierCars: async (req, res) => {
//     try {
//       const cars = await advertisementService.getSupplierCars(req.params.id);
//       res.status(200).json({ success: true, data: cars });
//     } catch (error) {
//       res.status(500).json({ success: false, message: error.message });
//     }
//   },
// };

// module.exports = advertisementController;
const advertisementService = require('../services/advertisementService');

const handleError = (res, error, fallback = 'حدث خطأ في الإعلانات') => {
  console.error('[advertisements]', error);
  return res.status(error.statusCode || 500).json({ success: false, message: error.message || fallback });
};

const uploadedImagePath = (req) => (
  req.file ? `/uploads/advertisements/${req.file.filename}` : null
);

const advertisementController = {
  getAdvertisementPricing: async (req, res) => {
    try { res.json({ success: true, data: await advertisementService.getAdvertisementPricing() }); }
    catch (error) { handleError(res, error, 'فشل جلب إعدادات الإعلان'); }
  },
  getActiveAdvertisements: async (req, res) => {
    try {
      const data =
        await advertisementService.getActiveAdvertisements({
          placement: req.query.placement,
          carId: req.query.car_id,
        });
  
      res.json({
        success: true,
        data,
      });
    } catch (error) {
      handleError(
        res,
        error,
        'فشل جلب الإعلانات النشطة'
      );
    }
  },
  
  

  recordImpression: async (req, res) => {
    try {
      await advertisementService.recordImpression(req.params.id);
      res.status(204).end();
    } catch (error) {
      handleError(res, error, 'فشل تسجيل ظهور الإعلان');
    }
  },

  recordClick: async (req, res) => {
    try {
      await advertisementService.recordClick(req.params.id);
      res.status(204).end();
    } catch (error) {
      handleError(res, error, 'فشل تسجيل نقرة الإعلان');
    }
  },

  getAllAdvertisements: async (req, res) => {
    try {
      const advertisements = await advertisementService.getAllAdvertisements(req.query);
      res.json({ success: true, data: advertisements });
    } catch (error) {
      handleError(res, error, 'فشل جلب الإعلانات');
    }
  },

  getAdvertisementById: async (req, res) => {
    try {
      const advertisement = await advertisementService.getAdvertisementById(req.params.id);
      if (!advertisement) return res.status(404).json({ success: false, message: 'الإعلان غير موجود' });
      res.json({ success: true, data: advertisement });
    } catch (error) {
      handleError(res, error, 'فشل جلب الإعلان');
    }
  },

  createAdvertisement: async (req, res) => {
    try {
      const image_url = uploadedImagePath(req);
      const newAd = await advertisementService.createAdvertisement({
        ...req.body,
        ...(image_url ? { image_url } : {}),
        created_by: req.user.id,
      });
      res.status(201).json({ success: true, data: newAd });
    } catch (error) {
      handleError(res, error, 'فشل إنشاء الإعلان');
    }
  },

  updateAdvertisement: async (req, res) => {
    try {
      const image_url = uploadedImagePath(req);
      const updatedAd = await advertisementService.updateAdvertisement(
        req.params.id,
        image_url ? { ...req.body, image_url } : req.body
      );
      if (!updatedAd) return res.status(404).json({ success: false, message: 'الإعلان غير موجود' });
      res.json({ success: true, data: updatedAd });
    } catch (error) {
      handleError(res, error, 'فشل تحديث الإعلان');
    }
  },

  deleteAdvertisement: async (req, res) => {
    try {
      const deletedAd = await advertisementService.deleteAdvertisement(req.params.id);
      if (!deletedAd) return res.status(404).json({ success: false, message: 'الإعلان غير موجود' });
      res.json({ success: true, message: 'تم حذف الإعلان بنجاح' });
    } catch (error) {
      handleError(res, error, 'فشل حذف الإعلان');
    }
  },

  getAdvertisementStats: async (req, res) => {
    try {
      const stats = await advertisementService.getAdvertisementStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      handleError(res, error, 'فشل جلب إحصائيات الإعلانات');
    }
  },

  getSuppliers: async (req, res) => {
    try {
      const suppliers = await advertisementService.getSuppliers(req.query.search || '');
      res.json({ success: true, data: suppliers });
    } catch (error) {
      handleError(res, error, 'فشل جلب الموردين');
    }
  },

  getSupplierCars: async (req, res) => {
    try {
      const cars = await advertisementService.getSupplierCars(req.params.id);
      res.json({ success: true, data: cars });
    } catch (error) {
      handleError(res, error, 'فشل جلب سيارات المورد');
    }
  },

  createAdvertisementRequest: async (req, res) => {
    try {
      const image_url = uploadedImagePath(req);
      const request = await advertisementService.createAdvertisementRequest(
        req.user.id,
        image_url ? { ...req.body, image_url } : req.body
      );
      res.status(201).json({ success: true, data: request, message: 'تم إرسال طلب الإعلان للمراجعة' });
    } catch (error) {
      handleError(res, error, 'فشل إرسال طلب الإعلان');
    }
  },

  getMyAdvertisementRequests: async (req, res) => {
    try {
      const requests = await advertisementService.getMyAdvertisementRequests(req.user.id);
      res.json({ success: true, data: requests });
    } catch (error) {
      handleError(res, error, 'فشل جلب طلبات الإعلانات');
    }
  },

  getAdvertisementRequests: async (req, res) => {
    try {
      const requests = await advertisementService.getAdvertisementRequests(req.query.status || 'all');
      res.json({ success: true, data: requests });
    } catch (error) {
      handleError(res, error, 'فشل جلب طلبات الإعلانات');
    }
  },

  approveAdvertisementRequest: async (req, res) => {
    try {
      const ad = await advertisementService.approveAdvertisementRequest(
        req.params.id,
        req.user.id,
        req.body?.note || ''
      );
  
      res.json({
        success: true,
        data: ad,
        message: 'تم اعتماد الطلب ونشر الإعلان',
      });    } catch (error) {
      handleError(res, error, 'فشل اعتماد طلب الإعلان');
    }
  },

  rejectAdvertisementRequest: async (req, res) => {
    try {
      const request = await advertisementService.rejectAdvertisementRequest(
        req.params.id,
        req.user.id,
        req.body?.note || ''
      );
  
      res.json({
        success: true,
        data: request,
        message: 'تم رفض طلب الإعلان',
      });
    } catch (error) {
      handleError(res, error, 'فشل رفض طلب الإعلان');
    }
  },
};
module.exports = advertisementController;


