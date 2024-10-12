import Vehicle from '../models/Vehicle.js'; // Adjust the import path based on your project structure

// Create Vehicle
export const createVehicle = async (req, res) => {
  try {
    const vehicle = new Vehicle(req.body);
    await vehicle.save();
    res.status(201).send({data:{vehicle},message:"Vehicle created successfully"});
  } catch (error) {
    res.status(400).send({ message: 'Error creating vehicle', details: error.message });
  }
};

// Read All Vehicles
export const getAllVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find();
    res.status(200).send({data:{vehicles},message:"Vehicles fetched successfully"});
  } catch (error) {
    res.status(500).send({ message: 'Error fetching vehicles', details: error.message });
  }
};

// Read Vehicle by ID
export const getVehicleById = async (req, res) => {
  const { id } = req.params;

  try {
    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      return res.status(404).send({ message: 'Vehicle not found' });
    }
    res.status(200).send({data:{vehicle},message:"Vehicle fetched successfully"});
  } catch (error) {
    res.status(500).send({ message: 'Error fetching vehicle', details: error.message });
  }
};

// Update Vehicle
export const updateVehicle = async (req, res) => {
  const { id } = req.params;
  const updates = Object.keys(req.body);
  const allowedUpdates = ['type', 'numberPlate', 'model', 'driverId', 'imageUrl'];
  const isValidOperation = updates.every((update) => allowedUpdates.includes(update));
  if (!isValidOperation) {
    return res.status(400).send({ message: 'Invalid updates!' });
  }

  try {
    const vehicle = await Vehicle.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!vehicle) {
      return res.status(404).send({ message: 'Vehicle not found' });
    }
    res.status(200).send({data:{ message: 'Vehicle updated successfully' }});
  } catch (error) {
    res.status(400).send({ message: 'Error updating vehicle', details: error.message });
  }
};

// Delete Vehicle
export const deleteVehicle = async (req, res) => {
  const { id } = req.params;

  try {
    const vehicle = await Vehicle.findByIdAndDelete(id);
    if (!vehicle) {
      return res.status(404).send({ message: 'Vehicle not found' });
    }
    res.status(200).send({message:"Vehicle deleted successfully"});
  } catch (error) {
    res.status(500).send({ message: 'Error deleting vehicle', details: error.message });
  }
};
