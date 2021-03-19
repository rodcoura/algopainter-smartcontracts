// SPDX-License-Identifier: GPL-v3
pragma solidity >=0.6.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

import "./AlgoPainterAccessControl.sol";

contract AlgoPainterGweiItem is AlgoPainterAccessControl, ERC721 {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    mapping(bytes32 => bool) hahses;

    address payable owner;
    uint256 paints;

    event NewPaint(
        uint256 indexed tokenId,
        address indexed owner,
        bytes32 indexed hash
    );

    constructor() ERC721("Algo Painter Gwei Item", "APGI") {
        owner = msg.sender;
    }

    function hashData(uint256 tokenId, string memory tokenURI)
        public
        pure
        returns (bytes32)
    {
        return keccak256(abi.encodePacked(tokenId, tokenURI));
    }

    function hashMint(bytes32 hash, string memory tokenURI)
        public
        pure
        returns (bytes32)
    {
        return keccak256(abi.encodePacked(hash, tokenURI));
    }

    /**
     * @notice Recover signer address from a message by using his signature
     * @param hash bytes32 message, the hash is the signed message. What is recovered is the signer address.
     * @param sig bytes signature, the signature is generated using web3.eth.sign()
     */
    function recover(bytes32 hash, bytes memory sig)
        public
        pure
        returns (address)
    {
        bytes32 r;
        bytes32 s;
        uint8 v;

        //Check the signature length
        if (sig.length != 65) {
            return (address(0));
        }

        // Divide the signature in r, s and v variables
        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }

        // Version of signature should be 27 or 28, but 0 and 1 are also possible versions
        if (v < 27) {
            v += 27;
        }

        // If the version is correct return the signer address
        if (v != 27 && v != 28) {
            return (address(0));
        } else {
            bytes memory prefix = "\x19Ethereum Signed Message:\n32";
            bytes32 prefixedHash = keccak256(abi.encodePacked(prefix, hash));
            return ecrecover(prefixedHash, v, r, s);
        }
    }

    function getMinimumAmount(uint256 paintsCount)
        public
        pure
        returns (uint256)
    {
        uint256 minimumAmount = 0;

        if (paintsCount <= 1000) {
            minimumAmount = 0.01 ether;
        } else if (paintsCount <= 3000) {
            minimumAmount = 0.03 ether;
        } else if (paintsCount <= 6000) {
            minimumAmount = 0.04 ether;
        } else if (paintsCount <= 10000) {
            minimumAmount = 0.05 ether;
        } else if (paintsCount <= 14000) {
            minimumAmount = 0.07 ether;
        } else if (paintsCount <= 14300) {
            minimumAmount = 0.1 ether;
        } else if (paintsCount <= 14500) {
            minimumAmount = 0.16 ether;
        } else if (paintsCount <= 14550) {
            minimumAmount = 0.27 ether;
        } else if (paintsCount <= 14576) {
            minimumAmount = 0.49 ether;
        } else if (paintsCount <= 14590) {
            minimumAmount = 0.92 ether;
        } else {
            minimumAmount = 1.85 ether;
        }

        return minimumAmount;
    }

    function mintPaint(
        bytes32 hash,
        string memory tokenURI,
        bytes calldata signature
    ) public payable returns (uint256) {
        require(paints < 14599, "AlgoPainterGweiItem: Gwei is retired!");

        bytes32 hashedMint = hashMint(hash, tokenURI);
        address validator = recover(hashedMint, signature);

        require(
            validator != address(0),
            "AlgoPainterGweiItem:INVALID_SIGNATURE"
        );
        require(
            hasRole(VALIDATOR_ROLE, validator),
            "AlgoPainterGweiItem:INVALID_VALIDATOR"
        );

        uint256 minimumAmount = getMinimumAmount(paints);
        require(
            msg.value >= minimumAmount,
            "AlgoPainterGweiItem: Invalid Amount"
        );

        _tokenIds.increment();

        uint256 newItemId = _tokenIds.current();
        _mint(msg.sender, newItemId);
        _setTokenURI(newItemId, tokenURI);

        hahses[hash] = true;

        paints++;

        emit NewPaint(newItemId, msg.sender, hash);

        return newItemId;
    }

    function withdraw() public {
        require(msg.sender == owner, "AlgoPainterGweiItem: Invalid msg.sender");
        owner.transfer(address(this).balance);
    }

    function updateTokenURI(
        uint256 tokenId,
        string calldata tokenURI,
        bytes calldata signature
    ) public {
        bytes32 hash = hashData(tokenId, tokenURI);
        address validator = recover(hash, signature);

        require(
            validator != address(0),
            "AlgoPainterGweiItem:INVALID_SIGNATURE"
        );
        require(
            hasRole(VALIDATOR_ROLE, validator),
            "AlgoPainterGweiItem:INVALID_VALIDATOR"
        );

        _setTokenURI(tokenId, tokenURI);
    }
}
