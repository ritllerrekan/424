// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract FoodSupplyChain {
    enum Phase { Collection, Testing, Processing, Manufacturing, Completed }
    enum Status { Active, Completed, Rejected }

    struct CollectorData {
        uint256 batchId;
        address collectorAddress;
        string batchNumber;
        int256 gpsLatitude;
        int256 gpsLongitude;
        string weatherCondition;
        int16 temperature;
        uint8 humidity;
        string harvestDate;
        string seedCropName;
        bool pesticideUsed;
        string pesticideName;
        string pesticideQuantity;
        uint256 pricePerUnit;
        uint256 weightTotal;
        uint256 totalPrice;
        string qrCodeData;
        uint256 timestamp;
    }

    struct TesterData {
        uint256 batchId;
        address testerAddress;
        uint256 collectorBatchId;
        int256 gpsLatitude;
        int256 gpsLongitude;
        string weatherCondition;
        int16 temperature;
        uint8 humidity;
        string testDate;
        uint256 qualityGradeScore;
        uint256 contaminantLevel;
        uint256 purityLevel;
        string labName;
        uint8 collectorRating;
        string collectorRatingNotes;
        string qrCodeData;
        uint256 timestamp;
    }

    struct ProcessorData {
        uint256 batchId;
        address processorAddress;
        uint256 testerBatchId;
        int256 gpsLatitude;
        int256 gpsLongitude;
        string weatherCondition;
        int16 temperature;
        string processingType;
        uint256 inputWeight;
        uint256 outputWeight;
        uint256 conversionRatio;
        string chemicalsAdditives;
        uint8 testerRating;
        string testerRatingNotes;
        string qrCodeData;
        uint256 timestamp;
    }

    struct ManufacturerData {
        uint256 batchId;
        address manufacturerAddress;
        uint256 processorBatchId;
        int256 gpsLatitude;
        int256 gpsLongitude;
        string weatherCondition;
        int16 temperature;
        string productName;
        string brandName;
        string productType;
        uint256 quantity;
        string unit;
        string location;
        string manufactureDate;
        string expiryDate;
        uint8 processorRating;
        string processorRatingNotes;
        string qrCodeData;
        uint256 timestamp;
    }

    struct Batch {
        string batchNumber;
        Phase currentPhase;
        Status status;
        address createdBy;
        uint256 createdAt;
        uint256 updatedAt;
    }

    mapping(uint256 => Batch) public batches;
    mapping(uint256 => CollectorData) public collectorRecords;
    mapping(uint256 => TesterData) public testerRecords;
    mapping(uint256 => ProcessorData) public processorRecords;
    mapping(uint256 => ManufacturerData) public manufacturerRecords;

    uint256 public batchCounter;

    event BatchCreated(uint256 indexed batchId, string batchNumber, address indexed creator);
    event CollectorDataAdded(uint256 indexed batchId, address indexed collector);
    event TesterDataAdded(uint256 indexed batchId, address indexed tester);
    event ProcessorDataAdded(uint256 indexed batchId, address indexed processor);
    event ManufacturerDataAdded(uint256 indexed batchId, address indexed manufacturer);
    event BatchCompleted(uint256 indexed batchId, address indexed completedBy);

    modifier batchExists(uint256 _batchId) {
        require(_batchId < batchCounter, "Batch does not exist");
        _;
    }

    function addCollectorData(
        string memory _batchNumber,
        int256 _gpsLatitude,
        int256 _gpsLongitude,
        string memory _weatherCondition,
        int16 _temperature,
        uint8 _humidity,
        string memory _harvestDate,
        string memory _seedCropName,
        bool _pesticideUsed,
        string memory _pesticideName,
        string memory _pesticideQuantity,
        uint256 _pricePerUnit,
        uint256 _weightTotal,
        uint256 _totalPrice,
        string memory _qrCodeData
    ) public returns (uint256) {
        uint256 batchId = batchCounter++;

        batches[batchId] = Batch({
            batchNumber: _batchNumber,
            currentPhase: Phase.Collection,
            status: Status.Active,
            createdBy: msg.sender,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });

        collectorRecords[batchId] = CollectorData({
            batchId: batchId,
            collectorAddress: msg.sender,
            batchNumber: _batchNumber,
            gpsLatitude: _gpsLatitude,
            gpsLongitude: _gpsLongitude,
            weatherCondition: _weatherCondition,
            temperature: _temperature,
            humidity: _humidity,
            harvestDate: _harvestDate,
            seedCropName: _seedCropName,
            pesticideUsed: _pesticideUsed,
            pesticideName: _pesticideName,
            pesticideQuantity: _pesticideQuantity,
            pricePerUnit: _pricePerUnit,
            weightTotal: _weightTotal,
            totalPrice: _totalPrice,
            qrCodeData: _qrCodeData,
            timestamp: block.timestamp
        });

        emit BatchCreated(batchId, _batchNumber, msg.sender);
        emit CollectorDataAdded(batchId, msg.sender);
        return batchId;
    }

    function addTesterData(
        uint256 _collectorBatchId,
        int256 _gpsLatitude,
        int256 _gpsLongitude,
        string memory _weatherCondition,
        int16 _temperature,
        uint8 _humidity,
        string memory _testDate,
        uint256 _qualityGradeScore,
        uint256 _contaminantLevel,
        uint256 _purityLevel,
        string memory _labName,
        uint8 _collectorRating,
        string memory _collectorRatingNotes,
        string memory _qrCodeData
    ) public batchExists(_collectorBatchId) returns (uint256) {
        require(batches[_collectorBatchId].status == Status.Active, "Batch is not active");
        require(batches[_collectorBatchId].currentPhase == Phase.Collection, "Not in Collection phase");

        uint256 batchId = batchCounter++;

        batches[batchId] = Batch({
            batchNumber: batches[_collectorBatchId].batchNumber,
            currentPhase: Phase.Testing,
            status: Status.Active,
            createdBy: msg.sender,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });

        testerRecords[batchId] = TesterData({
            batchId: batchId,
            testerAddress: msg.sender,
            collectorBatchId: _collectorBatchId,
            gpsLatitude: _gpsLatitude,
            gpsLongitude: _gpsLongitude,
            weatherCondition: _weatherCondition,
            temperature: _temperature,
            humidity: _humidity,
            testDate: _testDate,
            qualityGradeScore: _qualityGradeScore,
            contaminantLevel: _contaminantLevel,
            purityLevel: _purityLevel,
            labName: _labName,
            collectorRating: _collectorRating,
            collectorRatingNotes: _collectorRatingNotes,
            qrCodeData: _qrCodeData,
            timestamp: block.timestamp
        });

        batches[_collectorBatchId].currentPhase = Phase.Testing;
        batches[_collectorBatchId].updatedAt = block.timestamp;

        emit TesterDataAdded(batchId, msg.sender);
        return batchId;
    }

    function addProcessorData(
        uint256 _testerBatchId,
        int256 _gpsLatitude,
        int256 _gpsLongitude,
        string memory _weatherCondition,
        int16 _temperature,
        string memory _processingType,
        uint256 _inputWeight,
        uint256 _outputWeight,
        uint256 _conversionRatio,
        string memory _chemicalsAdditives,
        uint8 _testerRating,
        string memory _testerRatingNotes,
        string memory _qrCodeData
    ) public batchExists(_testerBatchId) returns (uint256) {
        require(batches[_testerBatchId].status == Status.Active, "Batch is not active");
        require(batches[_testerBatchId].currentPhase == Phase.Testing, "Not in Testing phase");

        uint256 batchId = batchCounter++;

        batches[batchId] = Batch({
            batchNumber: batches[_testerBatchId].batchNumber,
            currentPhase: Phase.Processing,
            status: Status.Active,
            createdBy: msg.sender,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });

        processorRecords[batchId] = ProcessorData({
            batchId: batchId,
            processorAddress: msg.sender,
            testerBatchId: _testerBatchId,
            gpsLatitude: _gpsLatitude,
            gpsLongitude: _gpsLongitude,
            weatherCondition: _weatherCondition,
            temperature: _temperature,
            processingType: _processingType,
            inputWeight: _inputWeight,
            outputWeight: _outputWeight,
            conversionRatio: _conversionRatio,
            chemicalsAdditives: _chemicalsAdditives,
            testerRating: _testerRating,
            testerRatingNotes: _testerRatingNotes,
            qrCodeData: _qrCodeData,
            timestamp: block.timestamp
        });

        batches[_testerBatchId].currentPhase = Phase.Processing;
        batches[_testerBatchId].updatedAt = block.timestamp;

        emit ProcessorDataAdded(batchId, msg.sender);
        return batchId;
    }

    function addManufacturerData(
        uint256 _processorBatchId,
        int256 _gpsLatitude,
        int256 _gpsLongitude,
        string memory _weatherCondition,
        int16 _temperature,
        string memory _productName,
        string memory _brandName,
        string memory _productType,
        uint256 _quantity,
        string memory _unit,
        string memory _location,
        string memory _manufactureDate,
        string memory _expiryDate,
        uint8 _processorRating,
        string memory _processorRatingNotes,
        string memory _qrCodeData
    ) public batchExists(_processorBatchId) returns (uint256) {
        require(batches[_processorBatchId].status == Status.Active, "Batch is not active");
        require(batches[_processorBatchId].currentPhase == Phase.Processing, "Not in Processing phase");

        uint256 batchId = batchCounter++;

        batches[batchId] = Batch({
            batchNumber: batches[_processorBatchId].batchNumber,
            currentPhase: Phase.Manufacturing,
            status: Status.Active,
            createdBy: msg.sender,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });

        manufacturerRecords[batchId] = ManufacturerData({
            batchId: batchId,
            manufacturerAddress: msg.sender,
            processorBatchId: _processorBatchId,
            gpsLatitude: _gpsLatitude,
            gpsLongitude: _gpsLongitude,
            weatherCondition: _weatherCondition,
            temperature: _temperature,
            productName: _productName,
            brandName: _brandName,
            productType: _productType,
            quantity: _quantity,
            unit: _unit,
            location: _location,
            manufactureDate: _manufactureDate,
            expiryDate: _expiryDate,
            processorRating: _processorRating,
            processorRatingNotes: _processorRatingNotes,
            qrCodeData: _qrCodeData,
            timestamp: block.timestamp
        });

        batches[_processorBatchId].currentPhase = Phase.Manufacturing;
        batches[_processorBatchId].updatedAt = block.timestamp;

        batches[batchId].currentPhase = Phase.Completed;
        batches[batchId].status = Status.Completed;

        emit ManufacturerDataAdded(batchId, msg.sender);
        emit BatchCompleted(batchId, msg.sender);
        return batchId;
    }

    function getBatch(uint256 _batchId)
        public
        view
        batchExists(_batchId)
        returns (Batch memory)
    {
        return batches[_batchId];
    }

    function getCollectorData(uint256 _batchId)
        public
        view
        batchExists(_batchId)
        returns (CollectorData memory)
    {
        return collectorRecords[_batchId];
    }

    function getTesterData(uint256 _batchId)
        public
        view
        batchExists(_batchId)
        returns (TesterData memory)
    {
        return testerRecords[_batchId];
    }

    function getProcessorData(uint256 _batchId)
        public
        view
        batchExists(_batchId)
        returns (ProcessorData memory)
    {
        return processorRecords[_batchId];
    }

    function getManufacturerData(uint256 _batchId)
        public
        view
        batchExists(_batchId)
        returns (ManufacturerData memory)
    {
        return manufacturerRecords[_batchId];
    }

    function getFullChain(uint256 _batchId)
        public
        view
        batchExists(_batchId)
        returns (
            Batch memory batch,
            CollectorData memory collector,
            TesterData memory tester,
            ProcessorData memory processor,
            ManufacturerData memory manufacturer
        )
    {
        batch = batches[_batchId];
        collector = collectorRecords[_batchId];
        tester = testerRecords[_batchId];
        processor = processorRecords[_batchId];
        manufacturer = manufacturerRecords[_batchId];
        return (batch, collector, tester, processor, manufacturer);
    }

    function getTotalBatches() public view returns (uint256) {
        return batchCounter;
    }
}
