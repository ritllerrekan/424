// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract FoodSupplyChain {
    enum Phase { Collection, Testing, Processing, Manufacturing, Completed }
    enum Status { Active, Completed, Rejected }

    struct Batch {
        string batchNumber;
        string productName;
        uint256 quantity;
        string unit;
        Phase currentPhase;
        Status status;
        address createdBy;
        uint256 createdAt;
        uint256 updatedAt;
    }

    struct PhaseRecord {
        uint256 batchId;
        Phase phaseType;
        address handler;
        string location;
        int16 temperature;
        uint8 humidity;
        uint8 qualityScore;
        string notes;
        uint256 timestamp;
    }

    struct TestResult {
        uint256 batchId;
        address tester;
        string testType;
        bool passed;
        uint8 contaminationLevel;
        bool pathogenDetected;
        uint8 pesticideLevel;
        string notes;
        uint256 timestamp;
    }

    mapping(uint256 => Batch) public batches;
    mapping(uint256 => PhaseRecord[]) public batchPhases;
    mapping(uint256 => TestResult[]) public testResults;

    uint256 public batchCounter;

    event BatchCreated(uint256 indexed batchId, string batchNumber, address indexed creator);
    event PhaseUpdated(uint256 indexed batchId, Phase newPhase, address indexed handler);
    event TestRecorded(uint256 indexed batchId, address indexed tester, bool passed);
    event BatchCompleted(uint256 indexed batchId, address indexed completedBy);

    modifier batchExists(uint256 _batchId) {
        require(_batchId < batchCounter, "Batch does not exist");
        _;
    }

    function createBatch(
        string memory _batchNumber,
        string memory _productName,
        uint256 _quantity,
        string memory _unit
    ) public returns (uint256) {
        uint256 batchId = batchCounter++;

        batches[batchId] = Batch({
            batchNumber: _batchNumber,
            productName: _productName,
            quantity: _quantity,
            unit: _unit,
            currentPhase: Phase.Collection,
            status: Status.Active,
            createdBy: msg.sender,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });

        emit BatchCreated(batchId, _batchNumber, msg.sender);
        return batchId;
    }

    function addPhaseRecord(
        uint256 _batchId,
        Phase _phaseType,
        string memory _location,
        int16 _temperature,
        uint8 _humidity,
        uint8 _qualityScore,
        string memory _notes
    ) public batchExists(_batchId) {
        require(batches[_batchId].status == Status.Active, "Batch is not active");

        PhaseRecord memory newPhase = PhaseRecord({
            batchId: _batchId,
            phaseType: _phaseType,
            handler: msg.sender,
            location: _location,
            temperature: _temperature,
            humidity: _humidity,
            qualityScore: _qualityScore,
            notes: _notes,
            timestamp: block.timestamp
        });

        batchPhases[_batchId].push(newPhase);
        batches[_batchId].currentPhase = _phaseType;
        batches[_batchId].updatedAt = block.timestamp;

        emit PhaseUpdated(_batchId, _phaseType, msg.sender);
    }

    function recordTest(
        uint256 _batchId,
        string memory _testType,
        bool _passed,
        uint8 _contaminationLevel,
        bool _pathogenDetected,
        uint8 _pesticideLevel,
        string memory _notes
    ) public batchExists(_batchId) {
        require(batches[_batchId].status == Status.Active, "Batch is not active");

        TestResult memory newTest = TestResult({
            batchId: _batchId,
            tester: msg.sender,
            testType: _testType,
            passed: _passed,
            contaminationLevel: _contaminationLevel,
            pathogenDetected: _pathogenDetected,
            pesticideLevel: _pesticideLevel,
            notes: _notes,
            timestamp: block.timestamp
        });

        testResults[_batchId].push(newTest);
        batches[_batchId].updatedAt = block.timestamp;

        if (!_passed) {
            batches[_batchId].status = Status.Rejected;
        }

        emit TestRecorded(_batchId, msg.sender, _passed);
    }

    function completeBatch(uint256 _batchId) public batchExists(_batchId) {
        require(batches[_batchId].status == Status.Active, "Batch is not active");
        require(
            batches[_batchId].currentPhase == Phase.Manufacturing,
            "Batch must be in Manufacturing phase"
        );

        batches[_batchId].currentPhase = Phase.Completed;
        batches[_batchId].status = Status.Completed;
        batches[_batchId].updatedAt = block.timestamp;

        emit BatchCompleted(_batchId, msg.sender);
    }

    function getBatch(uint256 _batchId)
        public
        view
        batchExists(_batchId)
        returns (Batch memory)
    {
        return batches[_batchId];
    }

    function getBatchPhases(uint256 _batchId)
        public
        view
        batchExists(_batchId)
        returns (PhaseRecord[] memory)
    {
        return batchPhases[_batchId];
    }

    function getTestResults(uint256 _batchId)
        public
        view
        batchExists(_batchId)
        returns (TestResult[] memory)
    {
        return testResults[_batchId];
    }

    function getTotalBatches() public view returns (uint256) {
        return batchCounter;
    }
}
