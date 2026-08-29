// const express = require('express');
// const router = express.Router();
// const { protect, authorize } = require('../middleware/auth');
// const {
//     getAllAdvertisements,
//     createAdvertisement,
//     updateAdvertisement,
//     ,
//     getSuppliers,
//     getSupplierCars
// } = require('../controllers/');

// // All routes here require login
// router.use(protect);

// // Admin only routes
// router.get('/admin/all', authorize('admin'), getAllAdvertisements);
// router.post('/', authorize('admin'), createAdvertisement);
// router.put('/:id', authorize('admin'), updateAdvertisement);
// router.delete('/:id', authorize('admin'), );

// // Helper routes for the form
// router.get('/suppliers', authorize('admin'), getSuppliers);
// router.get('/suppliers/:id/cars', authorize('admin'), getSupplierCars);

// module.exports = router;

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { uploadAdvertisementImage } = require('../middleware/upload');
const controller = require('../controllers/advertisementController');

// Public slots: the component can render without requiring the visitor to log in.
router.get('/pricing', controller.getAdvertisementPricing);
router.get('/active', controller.getActiveAdvertisements);
router.post('/:id/impression', controller.recordImpression);
router.post('/:id/click', controller.recordClick);

router.use(protect);

// Supplier request flow.
router.post('/requests', authorize('supplier'), uploadAdvertisementImage, controller.createAdvertisementRequest);
router.get('/requests/mine', authorize('supplier'), controller.getMyAdvertisementRequests);

// Admin request review, dashboard statistics, and ad library.
router.get('/admin/stats', authorize('admin'), controller.getAdvertisementStats);
router.get('/admin/requests', authorize('admin'), controller.getAdvertisementRequests);
router.put('/admin/requests/:id/approve', authorize('admin'), controller.approveAdvertisementRequest);
router.put('/admin/requests/:id/reject', authorize('admin'), controller.rejectAdvertisementRequest);
router.get('/admin/all', authorize('admin'), controller.getAllAdvertisements);
router.get('/suppliers', authorize('admin'), controller.getSuppliers);
router.get('/suppliers/:id/cars', authorize('admin'), controller.getSupplierCars);
router.post('/', authorize('admin'), uploadAdvertisementImage, controller.createAdvertisement);
router.put('/:id', authorize('admin'), uploadAdvertisementImage, controller.updateAdvertisement);
router.delete('/:id', authorize('admin'), controller.deleteAdvertisement);
router.get('/:id', authorize('admin'), controller.getAdvertisementById);

module.exports = router;
