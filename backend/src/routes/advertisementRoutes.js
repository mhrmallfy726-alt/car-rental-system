const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
    getAllAdvertisements,
    createAdvertisement,
    updateAdvertisement,
    deleteAdvertisement,
    getSuppliers,
    getSupplierCars
} = require('../controllers/advertisementController');

// All routes here require login
router.use(protect);

// Admin only routes
router.get('/admin/all', authorize('admin'), getAllAdvertisements);
router.post('/', authorize('admin'), createAdvertisement);
router.put('/:id', authorize('admin'), updateAdvertisement);
router.delete('/:id', authorize('admin'), deleteAdvertisement);

// Helper routes for the form
router.get('/suppliers', authorize('admin'), getSuppliers);
router.get('/suppliers/:id/cars', authorize('admin'), getSupplierCars);

module.exports = router;
