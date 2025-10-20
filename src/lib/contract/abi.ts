export const FOOD_SUPPLY_CHAIN_ABI = [
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "batchId", "type": "uint256" },
      { "indexed": false, "internalType": "string", "name": "batchNumber", "type": "string" },
      { "indexed": true, "internalType": "address", "name": "creator", "type": "address" }
    ],
    "name": "BatchCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "batchId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "completedBy", "type": "address" }
    ],
    "name": "BatchCompleted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "batchId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "collector", "type": "address" }
    ],
    "name": "CollectorDataAdded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "batchId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "tester", "type": "address" }
    ],
    "name": "TesterDataAdded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "batchId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "processor", "type": "address" }
    ],
    "name": "ProcessorDataAdded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "batchId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "manufacturer", "type": "address" }
    ],
    "name": "ManufacturerDataAdded",
    "type": "event"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "_batchNumber", "type": "string" },
      { "internalType": "int256", "name": "_gpsLatitude", "type": "int256" },
      { "internalType": "int256", "name": "_gpsLongitude", "type": "int256" },
      { "internalType": "string", "name": "_weatherCondition", "type": "string" },
      { "internalType": "int16", "name": "_temperature", "type": "int16" },
      { "internalType": "uint8", "name": "_humidity", "type": "uint8" },
      { "internalType": "string", "name": "_harvestDate", "type": "string" },
      { "internalType": "string", "name": "_seedCropName", "type": "string" },
      { "internalType": "bool", "name": "_pesticideUsed", "type": "bool" },
      { "internalType": "string", "name": "_pesticideName", "type": "string" },
      { "internalType": "string", "name": "_pesticideQuantity", "type": "string" },
      { "internalType": "uint256", "name": "_pricePerUnit", "type": "uint256" },
      { "internalType": "uint256", "name": "_weightTotal", "type": "uint256" },
      { "internalType": "uint256", "name": "_totalPrice", "type": "uint256" },
      { "internalType": "string", "name": "_qrCodeData", "type": "string" }
    ],
    "name": "addCollectorData",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_collectorBatchId", "type": "uint256" },
      { "internalType": "int256", "name": "_gpsLatitude", "type": "int256" },
      { "internalType": "int256", "name": "_gpsLongitude", "type": "int256" },
      { "internalType": "string", "name": "_weatherCondition", "type": "string" },
      { "internalType": "int16", "name": "_temperature", "type": "int16" },
      { "internalType": "uint8", "name": "_humidity", "type": "uint8" },
      { "internalType": "string", "name": "_testDate", "type": "string" },
      { "internalType": "uint256", "name": "_qualityGradeScore", "type": "uint256" },
      { "internalType": "uint256", "name": "_contaminantLevel", "type": "uint256" },
      { "internalType": "uint256", "name": "_purityLevel", "type": "uint256" },
      { "internalType": "string", "name": "_labName", "type": "string" },
      { "internalType": "uint8", "name": "_collectorRating", "type": "uint8" },
      { "internalType": "string", "name": "_collectorRatingNotes", "type": "string" },
      { "internalType": "string", "name": "_qrCodeData", "type": "string" }
    ],
    "name": "addTesterData",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_testerBatchId", "type": "uint256" },
      { "internalType": "int256", "name": "_gpsLatitude", "type": "int256" },
      { "internalType": "int256", "name": "_gpsLongitude", "type": "int256" },
      { "internalType": "string", "name": "_weatherCondition", "type": "string" },
      { "internalType": "int16", "name": "_temperature", "type": "int16" },
      { "internalType": "string", "name": "_processingType", "type": "string" },
      { "internalType": "uint256", "name": "_inputWeight", "type": "uint256" },
      { "internalType": "uint256", "name": "_outputWeight", "type": "uint256" },
      { "internalType": "uint256", "name": "_conversionRatio", "type": "uint256" },
      { "internalType": "string", "name": "_chemicalsAdditives", "type": "string" },
      { "internalType": "uint8", "name": "_testerRating", "type": "uint8" },
      { "internalType": "string", "name": "_testerRatingNotes", "type": "string" },
      { "internalType": "string", "name": "_qrCodeData", "type": "string" }
    ],
    "name": "addProcessorData",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_processorBatchId", "type": "uint256" },
      { "internalType": "int256", "name": "_gpsLatitude", "type": "int256" },
      { "internalType": "int256", "name": "_gpsLongitude", "type": "int256" },
      { "internalType": "string", "name": "_weatherCondition", "type": "string" },
      { "internalType": "int16", "name": "_temperature", "type": "int16" },
      { "internalType": "string", "name": "_productName", "type": "string" },
      { "internalType": "string", "name": "_brandName", "type": "string" },
      { "internalType": "string", "name": "_productType", "type": "string" },
      { "internalType": "uint256", "name": "_quantity", "type": "uint256" },
      { "internalType": "string", "name": "_unit", "type": "string" },
      { "internalType": "string", "name": "_location", "type": "string" },
      { "internalType": "string", "name": "_manufactureDate", "type": "string" },
      { "internalType": "string", "name": "_expiryDate", "type": "string" },
      { "internalType": "uint8", "name": "_processorRating", "type": "uint8" },
      { "internalType": "string", "name": "_processorRatingNotes", "type": "string" },
      { "internalType": "string", "name": "_qrCodeData", "type": "string" }
    ],
    "name": "addManufacturerData",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "_batchId", "type": "uint256" }],
    "name": "getBatch",
    "outputs": [
      {
        "components": [
          { "internalType": "string", "name": "batchNumber", "type": "string" },
          { "internalType": "enum FoodSupplyChain.Phase", "name": "currentPhase", "type": "uint8" },
          { "internalType": "enum FoodSupplyChain.Status", "name": "status", "type": "uint8" },
          { "internalType": "address", "name": "createdBy", "type": "address" },
          { "internalType": "uint256", "name": "createdAt", "type": "uint256" },
          { "internalType": "uint256", "name": "updatedAt", "type": "uint256" }
        ],
        "internalType": "struct FoodSupplyChain.Batch",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "_batchId", "type": "uint256" }],
    "name": "getCollectorData",
    "outputs": [
      {
        "components": [
          { "internalType": "uint256", "name": "batchId", "type": "uint256" },
          { "internalType": "address", "name": "collectorAddress", "type": "address" },
          { "internalType": "string", "name": "batchNumber", "type": "string" },
          { "internalType": "int256", "name": "gpsLatitude", "type": "int256" },
          { "internalType": "int256", "name": "gpsLongitude", "type": "int256" },
          { "internalType": "string", "name": "weatherCondition", "type": "string" },
          { "internalType": "int16", "name": "temperature", "type": "int16" },
          { "internalType": "uint8", "name": "humidity", "type": "uint8" },
          { "internalType": "string", "name": "harvestDate", "type": "string" },
          { "internalType": "string", "name": "seedCropName", "type": "string" },
          { "internalType": "bool", "name": "pesticideUsed", "type": "bool" },
          { "internalType": "string", "name": "pesticideName", "type": "string" },
          { "internalType": "string", "name": "pesticideQuantity", "type": "string" },
          { "internalType": "uint256", "name": "pricePerUnit", "type": "uint256" },
          { "internalType": "uint256", "name": "weightTotal", "type": "uint256" },
          { "internalType": "uint256", "name": "totalPrice", "type": "uint256" },
          { "internalType": "string", "name": "qrCodeData", "type": "string" },
          { "internalType": "uint256", "name": "timestamp", "type": "uint256" }
        ],
        "internalType": "struct FoodSupplyChain.CollectorData",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "_batchId", "type": "uint256" }],
    "name": "getTesterData",
    "outputs": [
      {
        "components": [
          { "internalType": "uint256", "name": "batchId", "type": "uint256" },
          { "internalType": "address", "name": "testerAddress", "type": "address" },
          { "internalType": "uint256", "name": "collectorBatchId", "type": "uint256" },
          { "internalType": "int256", "name": "gpsLatitude", "type": "int256" },
          { "internalType": "int256", "name": "gpsLongitude", "type": "int256" },
          { "internalType": "string", "name": "weatherCondition", "type": "string" },
          { "internalType": "int16", "name": "temperature", "type": "int16" },
          { "internalType": "uint8", "name": "humidity", "type": "uint8" },
          { "internalType": "string", "name": "testDate", "type": "string" },
          { "internalType": "uint256", "name": "qualityGradeScore", "type": "uint256" },
          { "internalType": "uint256", "name": "contaminantLevel", "type": "uint256" },
          { "internalType": "uint256", "name": "purityLevel", "type": "uint256" },
          { "internalType": "string", "name": "labName", "type": "string" },
          { "internalType": "uint8", "name": "collectorRating", "type": "uint8" },
          { "internalType": "string", "name": "collectorRatingNotes", "type": "string" },
          { "internalType": "string", "name": "qrCodeData", "type": "string" },
          { "internalType": "uint256", "name": "timestamp", "type": "uint256" }
        ],
        "internalType": "struct FoodSupplyChain.TesterData",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "_batchId", "type": "uint256" }],
    "name": "getProcessorData",
    "outputs": [
      {
        "components": [
          { "internalType": "uint256", "name": "batchId", "type": "uint256" },
          { "internalType": "address", "name": "processorAddress", "type": "address" },
          { "internalType": "uint256", "name": "testerBatchId", "type": "uint256" },
          { "internalType": "int256", "name": "gpsLatitude", "type": "int256" },
          { "internalType": "int256", "name": "gpsLongitude", "type": "int256" },
          { "internalType": "string", "name": "weatherCondition", "type": "string" },
          { "internalType": "int16", "name": "temperature", "type": "int16" },
          { "internalType": "string", "name": "processingType", "type": "string" },
          { "internalType": "uint256", "name": "inputWeight", "type": "uint256" },
          { "internalType": "uint256", "name": "outputWeight", "type": "uint256" },
          { "internalType": "uint256", "name": "conversionRatio", "type": "uint256" },
          { "internalType": "string", "name": "chemicalsAdditives", "type": "string" },
          { "internalType": "uint8", "name": "testerRating", "type": "uint8" },
          { "internalType": "string", "name": "testerRatingNotes", "type": "string" },
          { "internalType": "string", "name": "qrCodeData", "type": "string" },
          { "internalType": "uint256", "name": "timestamp", "type": "uint256" }
        ],
        "internalType": "struct FoodSupplyChain.ProcessorData",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "_batchId", "type": "uint256" }],
    "name": "getManufacturerData",
    "outputs": [
      {
        "components": [
          { "internalType": "uint256", "name": "batchId", "type": "uint256" },
          { "internalType": "address", "name": "manufacturerAddress", "type": "address" },
          { "internalType": "uint256", "name": "processorBatchId", "type": "uint256" },
          { "internalType": "int256", "name": "gpsLatitude", "type": "int256" },
          { "internalType": "int256", "name": "gpsLongitude", "type": "int256" },
          { "internalType": "string", "name": "weatherCondition", "type": "string" },
          { "internalType": "int16", "name": "temperature", "type": "int16" },
          { "internalType": "string", "name": "productName", "type": "string" },
          { "internalType": "string", "name": "brandName", "type": "string" },
          { "internalType": "string", "name": "productType", "type": "string" },
          { "internalType": "uint256", "name": "quantity", "type": "uint256" },
          { "internalType": "string", "name": "unit", "type": "string" },
          { "internalType": "string", "name": "location", "type": "string" },
          { "internalType": "string", "name": "manufactureDate", "type": "string" },
          { "internalType": "string", "name": "expiryDate", "type": "string" },
          { "internalType": "uint8", "name": "processorRating", "type": "uint8" },
          { "internalType": "string", "name": "processorRatingNotes", "type": "string" },
          { "internalType": "string", "name": "qrCodeData", "type": "string" },
          { "internalType": "uint256", "name": "timestamp", "type": "uint256" }
        ],
        "internalType": "struct FoodSupplyChain.ManufacturerData",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "_batchId", "type": "uint256" }],
    "name": "getFullChain",
    "outputs": [
      {
        "components": [
          { "internalType": "string", "name": "batchNumber", "type": "string" },
          { "internalType": "enum FoodSupplyChain.Phase", "name": "currentPhase", "type": "uint8" },
          { "internalType": "enum FoodSupplyChain.Status", "name": "status", "type": "uint8" },
          { "internalType": "address", "name": "createdBy", "type": "address" },
          { "internalType": "uint256", "name": "createdAt", "type": "uint256" },
          { "internalType": "uint256", "name": "updatedAt", "type": "uint256" }
        ],
        "internalType": "struct FoodSupplyChain.Batch",
        "name": "batch",
        "type": "tuple"
      },
      {
        "components": [
          { "internalType": "uint256", "name": "batchId", "type": "uint256" },
          { "internalType": "address", "name": "collectorAddress", "type": "address" },
          { "internalType": "string", "name": "batchNumber", "type": "string" },
          { "internalType": "int256", "name": "gpsLatitude", "type": "int256" },
          { "internalType": "int256", "name": "gpsLongitude", "type": "int256" },
          { "internalType": "string", "name": "weatherCondition", "type": "string" },
          { "internalType": "int16", "name": "temperature", "type": "int16" },
          { "internalType": "uint8", "name": "humidity", "type": "uint8" },
          { "internalType": "string", "name": "harvestDate", "type": "string" },
          { "internalType": "string", "name": "seedCropName", "type": "string" },
          { "internalType": "bool", "name": "pesticideUsed", "type": "bool" },
          { "internalType": "string", "name": "pesticideName", "type": "string" },
          { "internalType": "string", "name": "pesticideQuantity", "type": "string" },
          { "internalType": "uint256", "name": "pricePerUnit", "type": "uint256" },
          { "internalType": "uint256", "name": "weightTotal", "type": "uint256" },
          { "internalType": "uint256", "name": "totalPrice", "type": "uint256" },
          { "internalType": "string", "name": "qrCodeData", "type": "string" },
          { "internalType": "uint256", "name": "timestamp", "type": "uint256" }
        ],
        "internalType": "struct FoodSupplyChain.CollectorData",
        "name": "collector",
        "type": "tuple"
      },
      {
        "components": [
          { "internalType": "uint256", "name": "batchId", "type": "uint256" },
          { "internalType": "address", "name": "testerAddress", "type": "address" },
          { "internalType": "uint256", "name": "collectorBatchId", "type": "uint256" },
          { "internalType": "int256", "name": "gpsLatitude", "type": "int256" },
          { "internalType": "int256", "name": "gpsLongitude", "type": "int256" },
          { "internalType": "string", "name": "weatherCondition", "type": "string" },
          { "internalType": "int16", "name": "temperature", "type": "int16" },
          { "internalType": "uint8", "name": "humidity", "type": "uint8" },
          { "internalType": "string", "name": "testDate", "type": "string" },
          { "internalType": "uint256", "name": "qualityGradeScore", "type": "uint256" },
          { "internalType": "uint256", "name": "contaminantLevel", "type": "uint256" },
          { "internalType": "uint256", "name": "purityLevel", "type": "uint256" },
          { "internalType": "string", "name": "labName", "type": "string" },
          { "internalType": "uint8", "name": "collectorRating", "type": "uint8" },
          { "internalType": "string", "name": "collectorRatingNotes", "type": "string" },
          { "internalType": "string", "name": "qrCodeData", "type": "string" },
          { "internalType": "uint256", "name": "timestamp", "type": "uint256" }
        ],
        "internalType": "struct FoodSupplyChain.TesterData",
        "name": "tester",
        "type": "tuple"
      },
      {
        "components": [
          { "internalType": "uint256", "name": "batchId", "type": "uint256" },
          { "internalType": "address", "name": "processorAddress", "type": "address" },
          { "internalType": "uint256", "name": "testerBatchId", "type": "uint256" },
          { "internalType": "int256", "name": "gpsLatitude", "type": "int256" },
          { "internalType": "int256", "name": "gpsLongitude", "type": "int256" },
          { "internalType": "string", "name": "weatherCondition", "type": "string" },
          { "internalType": "int16", "name": "temperature", "type": "int16" },
          { "internalType": "string", "name": "processingType", "type": "string" },
          { "internalType": "uint256", "name": "inputWeight", "type": "uint256" },
          { "internalType": "uint256", "name": "outputWeight", "type": "uint256" },
          { "internalType": "uint256", "name": "conversionRatio", "type": "uint256" },
          { "internalType": "string", "name": "chemicalsAdditives", "type": "string" },
          { "internalType": "uint8", "name": "testerRating", "type": "uint8" },
          { "internalType": "string", "name": "testerRatingNotes", "type": "string" },
          { "internalType": "string", "name": "qrCodeData", "type": "string" },
          { "internalType": "uint256", "name": "timestamp", "type": "uint256" }
        ],
        "internalType": "struct FoodSupplyChain.ProcessorData",
        "name": "processor",
        "type": "tuple"
      },
      {
        "components": [
          { "internalType": "uint256", "name": "batchId", "type": "uint256" },
          { "internalType": "address", "name": "manufacturerAddress", "type": "address" },
          { "internalType": "uint256", "name": "processorBatchId", "type": "uint256" },
          { "internalType": "int256", "name": "gpsLatitude", "type": "int256" },
          { "internalType": "int256", "name": "gpsLongitude", "type": "int256" },
          { "internalType": "string", "name": "weatherCondition", "type": "string" },
          { "internalType": "int16", "name": "temperature", "type": "int16" },
          { "internalType": "string", "name": "productName", "type": "string" },
          { "internalType": "string", "name": "brandName", "type": "string" },
          { "internalType": "string", "name": "productType", "type": "string" },
          { "internalType": "uint256", "name": "quantity", "type": "uint256" },
          { "internalType": "string", "name": "unit", "type": "string" },
          { "internalType": "string", "name": "location", "type": "string" },
          { "internalType": "string", "name": "manufactureDate", "type": "string" },
          { "internalType": "string", "name": "expiryDate", "type": "string" },
          { "internalType": "uint8", "name": "processorRating", "type": "uint8" },
          { "internalType": "string", "name": "processorRatingNotes", "type": "string" },
          { "internalType": "string", "name": "qrCodeData", "type": "string" },
          { "internalType": "uint256", "name": "timestamp", "type": "uint256" }
        ],
        "internalType": "struct FoodSupplyChain.ManufacturerData",
        "name": "manufacturer",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getTotalBatches",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "name": "batches",
    "outputs": [
      { "internalType": "string", "name": "batchNumber", "type": "string" },
      { "internalType": "enum FoodSupplyChain.Phase", "name": "currentPhase", "type": "uint8" },
      { "internalType": "enum FoodSupplyChain.Status", "name": "status", "type": "uint8" },
      { "internalType": "address", "name": "createdBy", "type": "address" },
      { "internalType": "uint256", "name": "createdAt", "type": "uint256" },
      { "internalType": "uint256", "name": "updatedAt", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "batchCounter",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  }
] as const;
