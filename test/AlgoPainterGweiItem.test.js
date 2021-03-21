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

    await instance.mint(paintHash, tokenURI, { from: owner, value: web3.utils.toWei('0.01', 'ether') });

    const returnedTokenURI = await instance.tokenURI(1);
    const minimumAmount = await instance.getMinimumAmount();

    expect(returnedTokenURI).to.be.equal('URI');
    expect(minimumAmount.toString()).to.be.equal('20000000000000000', 'fail to theck increment of minimum value');
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

  it('should fail to update a token URI based on an invalid validator', async () => {
    const instance = await AlgoPainterGweiItem.deployed();

    const tokenId = 1;
    const tokenURI = 'NEW_URI'
    const owner = accounts[2];

    const hash = await instance.hashData(tokenId, tokenURI);

    const signature = await web3.eth.sign(hash, accounts[3]);
    try {
      await instance.updateTokenURI(1, tokenURI, signature);
    } catch (e) {
      expect(e.reason).to.be.equal('AlgoPainterGweiItem:INVALID_VALIDATOR', 'fail to check failure');
    }
  });

  it('should fail to update a token URI based on an invalid signature', async () => {
    const instance = await AlgoPainterGweiItem.deployed();
    const tokenURI = 'NEW_URI'

    const signature = '0x0';

    try {
      await instance.updateTokenURI(1, tokenURI, signature);
    } catch (e) {
      expect(e.reason).to.be.equal('AlgoPainterGweiItem:INVALID_SIGNATURE', 'fail to check failure');
    }
  });

  it('should fail to try to withdraw with an invalid address', async () => {
    const instance = await AlgoPainterGweiItem.deployed();

    try {
      await instance.withdraw(1, {from: accounts[1]});
    } catch (e) {
      expect(e.reason).to.be.equal('AlgoPainterGweiItem: Invalid msg.sender', 'fail to check failure');
    }
  });

  it('should withdraw with a valid address', async () => {
    const instance = await AlgoPainterGweiItem.deployed();

    const initialContractBalance = (await web3.eth.getBalance(instance.address)).toString();
    const initialBalance = (await web3.eth.getBalance(accounts[0])).toString();
    
    await instance.withdraw(initialContractBalance);

    const finalContractBalance = (await web3.eth.getBalance(instance.address)).toString();
    const finalBalance = (await web3.eth.getBalance(accounts[0])).toString();

    expect(initialContractBalance).to.be.equal('10000000000000000');
    expect(finalContractBalance).to.be.equal('0');
    // web3.from

    // expect(initialBalance).to.be.equal('92795621050000000003');
    // expect(finalBalance).to.be.equal('92805018970000000003');
  });
});
