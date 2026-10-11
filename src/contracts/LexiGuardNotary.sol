// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title LexiGuardNotary
 * @dev On-Chain Legal Proof of Existence & Automated Escrow Vault
 * Built for BLI Legal Tech Hackathon 2 by InnoXpert Studio
 */
contract LexiGuardNotary {
    address public immutable owner;

    struct LegalDocument {
        bytes32 docHash;          // SHA-256 or keccak256 hash of the contract
        string docTitle;          // Name / Title of agreement
        string metadataURI;       // IPFS / Firebase URI containing audit report
        uint8 complianceScore;    // AI Legal Health Score (0-100)
        address notarizedBy;      // Wallet address of the initiator
        uint256 timestamp;        // Immutable blockchain timestamp
        bool isVerified;          // Proof of existence flag
    }

    struct EscrowAgreement {
        bytes32 agreementId;
        address payable client;
        address payable contractor;
        uint256 amount;
        string milestoneDescription;
        bool isCompleted;
        bool isRefunded;
    }

    // Mappings
    mapping(bytes32 => LegalDocument) public documents;
    mapping(bytes32 => EscrowAgreement) public escrows;
    bytes32[] public notarizedDocumentHashes;

    // Events
    event DocumentNotarized(
        bytes32 indexed docHash,
        string docTitle,
        address indexed notarizedBy,
        uint8 complianceScore,
        uint256 timestamp
    );

    event EscrowCreated(
        bytes32 indexed agreementId,
        address indexed client,
        address indexed contractor,
        uint256 amount
    );

    event EscrowReleased(bytes32 indexed agreementId, uint256 amount);
    event EscrowRefunded(bytes32 indexed agreementId, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can invoke this");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @dev Notarizes a legal contract hash onto the blockchain.
     */
    function notarizeContract(
        bytes32 _docHash,
        string calldata _docTitle,
        string calldata _metadataURI,
        uint8 _complianceScore
    ) external returns (bool) {
        require(_docHash != bytes32(0), "Invalid document hash");
        require(!documents[_docHash].isVerified, "Document already notarized on-chain");
        require(_complianceScore <= 100, "Compliance score must be <= 100");

        documents[_docHash] = LegalDocument({
            docHash: _docHash,
            docTitle: _docTitle,
            metadataURI: _metadataURI,
            complianceScore: _complianceScore,
            notarizedBy: msg.sender,
            timestamp: block.timestamp,
            isVerified: true
        });

        notarizedDocumentHashes.push(_docHash);

        emit DocumentNotarized(
            _docHash,
            _docTitle,
            msg.sender,
            _complianceScore,
            block.timestamp
        );

        return true;
    }

    /**
     * @dev Verifies if a given contract hash exists on-chain and returns proof details.
     */
    function verifyDocument(bytes32 _docHash)
        external
        view
        returns (
            bool isVerified,
            string memory docTitle,
            string memory metadataURI,
            uint8 complianceScore,
            address notarizedBy,
            uint256 timestamp
        )
    {
        LegalDocument memory doc = documents[_docHash];
        return (
            doc.isVerified,
            doc.docTitle,
            doc.metadataURI,
            doc.complianceScore,
            doc.notarizedBy,
            doc.timestamp
        );
    }

    /**
     * @dev Total count of notarized documents.
     */
    function totalNotarizedCount() external view returns (uint256) {
        return notarizedDocumentHashes.length;
    }

    /**
     * @dev Create an Escrow milestone agreement
     */
    function createEscrow(
        bytes32 _agreementId,
        address payable _contractor,
        string calldata _milestoneDescription
    ) external payable {
        require(msg.value > 0, "Escrow deposit must be > 0");
        require(escrows[_agreementId].amount == 0, "Escrow already exists");
        require(_contractor != address(0), "Invalid contractor");

        escrows[_agreementId] = EscrowAgreement({
            agreementId: _agreementId,
            client: payable(msg.sender),
            contractor: _contractor,
            amount: msg.value,
            milestoneDescription: _milestoneDescription,
            isCompleted: false,
            isRefunded: false
        });

        emit EscrowCreated(_agreementId, msg.sender, _contractor, msg.value);
    }

    /**
     * @dev Release escrow funds to contractor upon milestone completion
     */
    function releaseEscrow(bytes32 _agreementId) external {
        EscrowAgreement storage agreement = escrows[_agreementId];
        require(msg.sender == agreement.client || msg.sender == owner, "Unauthorized");
        require(!agreement.isCompleted && !agreement.isRefunded, "Already finalized");

        agreement.isCompleted = true;
        agreement.contractor.transfer(agreement.amount);

        emit EscrowReleased(_agreementId, agreement.amount);
    }
}
