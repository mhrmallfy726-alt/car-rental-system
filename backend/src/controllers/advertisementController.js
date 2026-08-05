const advertisementService = require("../services/advertisementService");

const advertisementController = {
  getAllAdvertisements: async (req, res) => {
    try {
      const advertisements = await advertisementService.getAllAdvertisements(req.query);
      res.status(200).json({ success: true, data: advertisements });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getAdvertisementById: async (req, res) => {
    try {
      const advertisement = await advertisementService.getAdvertisementById(req.params.id);
      if (!advertisement) {
        return res.status(404).json({ success: false, message: "Advertisement not found" });
      }
      res.status(200).json({ success: true, data: advertisement });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  createAdvertisement: async (req, res) => {
    try {
      const newAd = await advertisementService.createAdvertisement(req.body);
      res.status(201).json({ success: true, data: newAd });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  updateAdvertisement: async (req, res) => {
    try {
      const updatedAd = await advertisementService.updateAdvertisement(req.params.id, req.body);
      if (!updatedAd) {
        return res.status(404).json({ success: false, message: "Advertisement not found" });
      }
      res.status(200).json({ success: true, data: updatedAd });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  deleteAdvertisement: async (req, res) => {
    try {
      const deletedAd = await advertisementService.deleteAdvertisement(req.params.id);
      if (!deletedAd) {
        return res.status(404).json({ success: false, message: "Advertisement not found" });
      }
      res.status(200).json({ success: true, message: "Advertisement deleted successfully" });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getSuppliers: async (req, res) => {
    try {
      const suppliers = await advertisementService.getSuppliers(req.query.search);
      res.status(200).json({ success: true, data: suppliers });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getSupplierCars: async (req, res) => {
    try {
      const cars = await advertisementService.getSupplierCars(req.params.id);
      res.status(200).json({ success: true, data: cars });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
};

module.exports = advertisementController;
