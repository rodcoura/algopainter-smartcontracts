const AlgoPainterGweiItem = artifacts.require('AlgoPainterGweiItem');

contract('AlgoPainterGweiItem', accounts => {
  it('should add account[1] as a validator', async () => {
    const instance = await AlgoPainterGweiItem.deployed();

    const validatorRole = await instance.VALIDATOR_ROLE();
    await instance.grantRole(validatorRole, accounts[1]);

    expect(await instance.hasRole(validatorRole, accounts[1])).to.be.equal(true, 'fail to check accounts[1] as a validator');
  });

  it('should mint a new paint', async () => {
    const instance = await AlgoPainterGweiItem.deployed();

    const paintHash = '0x6ca8f58fda09b62ef6446ecae2f863e8f4d39662435dcd3c72e0df5e6c55645b';
    const tokenURI = 'URI'
    const owner = accounts[2];

    //hashing the content used to mint a paint
    const hash = await instance.hashMint(paintHash, tokenURI);

    //creating a validator signature
    const signature = await web3.eth.sign(hash, accounts[1]);
    const tokenId = await instance.mintPaint(paintHash, tokenURI, signature, { from: owner, value: web3.utils.toWei('0.01', 'ether') });

    const returnedTokenURI = await instance.tokenURI(1);
    expect(returnedTokenURI).to.be.equal('URI');
  });

  it('should update a token URI based on a valid signature', async () => {
    const instance = await AlgoPainterGweiItem.deployed();

    const tokenId = 1;
    const tokenURI = 'NEW_URI'
    const owner = accounts[2];

    //hashing the content used to mint a paint
    const hash = await instance.hashData(tokenId, tokenURI);

    //creating a validator signature
    const signature = await web3.eth.sign(hash, accounts[1]);
    await instance.updateTokenURI(1, tokenURI, signature);

    const returnedTokenURI = await instance.tokenURI(1);
    expect(returnedTokenURI).to.be.equal('NEW_URI');
  });

  it('should fail to mint a new paint with a invalid validator', async () => {
    const instance = await AlgoPainterGweiItem.deployed();

    const paintHash = '0x6ca8f58fda09b62ef6446ecae2f863e8f4d39662435dcd3c72e0df5e6c55645b';
    const tokenURI = 'URI'
    const owner = accounts[2];

    //hashing the content used to mint a paint
    const hash = await instance.hashMint(paintHash, tokenURI);

    //creating a validator signature
    const signature = await web3.eth.sign(hash, accounts[2]);

    try {
      const tokenId = await instance.mintPaint(paintHash, tokenURI, signature, { from: owner, value: web3.utils.toWei('1', 'ether') });
    } catch (e) {
      expect(e.reason).to.be.equal('AlgoPainterGweiItem:INVALID_VALIDATOR');
    }
  });

  it('should fail to mint a new paint with a invalid signature', async () => {
    const instance = await AlgoPainterGweiItem.deployed();

    const paintHash = '0x6ca8f58fda09b62ef6446ecae2f863e8f4d39662435dcd3c72e0df5e6c55645b';
    const tokenURI = 'URI'
    const owner = accounts[2];

    //hashing the content used to mint a paint
    const hash = await instance.hashMint(paintHash, tokenURI);

    //creating a validator signature
    const signature = await web3.eth.sign(hash, accounts[2]);
    signature[3] = 'b';

    try {
      const tokenId = await instance.mintPaint(paintHash, tokenURI, signature, { from: owner, value: web3.utils.toWei('1', 'ether') });
    } catch (e) {
      expect(e.reason).to.be.equal('AlgoPainterGweiItem:INVALID_VALIDATOR');
    }
  });

  it('should check minimum amounts by paints number', async () => {
    const instance = await AlgoPainterGweiItem.deployed();

    expect((await instance.getMinimumAmount(5)).toString()).to.be.equal(web3.utils.toWei('0.01', 'ether'));
    expect((await instance.getMinimumAmount(2000)).toString()).to.be.equal(web3.utils.toWei('0.03', 'ether'));
    expect((await instance.getMinimumAmount(4587)).toString()).to.be.equal(web3.utils.toWei('0.04', 'ether'));
    expect((await instance.getMinimumAmount(6390)).toString()).to.be.equal(web3.utils.toWei('0.05', 'ether'));
    expect((await instance.getMinimumAmount(12780)).toString()).to.be.equal(web3.utils.toWei('0.07', 'ether'));
    expect((await instance.getMinimumAmount(14280)).toString()).to.be.equal(web3.utils.toWei('0.1', 'ether'));
    expect((await instance.getMinimumAmount(14320)).toString()).to.be.equal(web3.utils.toWei('0.16', 'ether'));
    expect((await instance.getMinimumAmount(14516)).toString()).to.be.equal(web3.utils.toWei('0.27', 'ether'));
    expect((await instance.getMinimumAmount(14555)).toString()).to.be.equal(web3.utils.toWei('0.49', 'ether'));
    expect((await instance.getMinimumAmount(14587)).toString()).to.be.equal(web3.utils.toWei('0.92', 'ether'));
    expect((await instance.getMinimumAmount(14597)).toString()).to.be.equal(web3.utils.toWei('1.85', 'ether'));

    expect((await instance.getMinimumAmount(1)).toString()).to.be.equal(web3.utils.toWei('0.01', 'ether'));
    expect((await instance.getMinimumAmount(1001)).toString()).to.be.equal(web3.utils.toWei('0.03', 'ether'));
    expect((await instance.getMinimumAmount(1001)).toString()).to.be.equal(web3.utils.toWei('0.03', 'ether'));
    expect((await instance.getMinimumAmount(3001)).toString()).to.be.equal(web3.utils.toWei('0.04', 'ether'));
    expect((await instance.getMinimumAmount(6001)).toString()).to.be.equal(web3.utils.toWei('0.05', 'ether'));
    expect((await instance.getMinimumAmount(10001)).toString()).to.be.equal(web3.utils.toWei('0.07', 'ether'));
    expect((await instance.getMinimumAmount(14001)).toString()).to.be.equal(web3.utils.toWei('0.1', 'ether'));
    expect((await instance.getMinimumAmount(14301)).toString()).to.be.equal(web3.utils.toWei('0.16', 'ether'));
    expect((await instance.getMinimumAmount(14501)).toString()).to.be.equal(web3.utils.toWei('0.27', 'ether'));
    expect((await instance.getMinimumAmount(14551)).toString()).to.be.equal(web3.utils.toWei('0.49', 'ether'));
    expect((await instance.getMinimumAmount(14577)).toString()).to.be.equal(web3.utils.toWei('0.92', 'ether'));
    expect((await instance.getMinimumAmount(14591)).toString()).to.be.equal(web3.utils.toWei('1.85', 'ether'));

    expect((await instance.getMinimumAmount(1000)).toString()).to.be.equal(web3.utils.toWei('0.01', 'ether'));
    expect((await instance.getMinimumAmount(3000)).toString()).to.be.equal(web3.utils.toWei('0.03', 'ether'));
    expect((await instance.getMinimumAmount(6000)).toString()).to.be.equal(web3.utils.toWei('0.04', 'ether'));
    expect((await instance.getMinimumAmount(10000)).toString()).to.be.equal(web3.utils.toWei('0.05', 'ether'));
    expect((await instance.getMinimumAmount(14000)).toString()).to.be.equal(web3.utils.toWei('0.07', 'ether'));
    expect((await instance.getMinimumAmount(14300)).toString()).to.be.equal(web3.utils.toWei('0.1', 'ether'));
    expect((await instance.getMinimumAmount(14500)).toString()).to.be.equal(web3.utils.toWei('0.16', 'ether'));
    expect((await instance.getMinimumAmount(14550)).toString()).to.be.equal(web3.utils.toWei('0.27', 'ether'));
    expect((await instance.getMinimumAmount(14576)).toString()).to.be.equal(web3.utils.toWei('0.49', 'ether'));
    expect((await instance.getMinimumAmount(14590)).toString()).to.be.equal(web3.utils.toWei('0.92', 'ether'));
  });
});
