const AlgoPainterToken = artifacts.require('AlgoPainterToken');
const AlgoPainterTimeLock = artifacts.require('AlgoPainterTimeLock');
var sleep = require('sleep');

contract.only('AlgoPainterToken', accounts => {
  it('should schedule a sequence of payments and request them', async () => {
    const algop = await AlgoPainterToken.new('AlgoPainter Token', 'ALGOP');
    const timelock = await AlgoPainterTimeLock.new(algop.address, 0);

    await algop.transfer(timelock.address, web3.utils.toWei('10000', 'ether'));

    await timelock.requestPayment({ from: accounts[1] });
    let remainingAmount = await timelock.getRemainingAmount(accounts[1]);
    let balanceAfterRequestAccount1 = await algop.balanceOf(accounts[1]);
    expect(balanceAfterRequestAccount1.toString()).to.be.equal('0', 'fail to check payment #-1 account #1');
    expect(remainingAmount.toString()).to.be.equal('0', 'fail to check remaining amount #-1 account #1');

    const ref = await timelock.getNow();

    await timelock.schedulePayment(accounts[1], await timelock.addSeconds(ref, 10), web3.utils.toWei('1', 'ether'));
    remainingAmount = await timelock.getRemainingAmount(accounts[1]);
    expect(remainingAmount.toString()).to.be.equal('1000000000000000000', '');
    await timelock.schedulePayment(accounts[1], await timelock.addSeconds(ref, 20), web3.utils.toWei('2', 'ether'));
    remainingAmount = await timelock.getRemainingAmount(accounts[1]);
    expect(remainingAmount.toString()).to.be.equal('3000000000000000000', '');
    await timelock.schedulePayment(accounts[1], await timelock.addSeconds(ref, 30), web3.utils.toWei('3', 'ether'));
    remainingAmount = await timelock.getRemainingAmount(accounts[1]);
    expect(remainingAmount.toString()).to.be.equal('6000000000000000000', '');

    await timelock.requestPayment({ from: accounts[1] });
    remainingAmount = await timelock.getRemainingAmount(accounts[1]);
    balanceAfterRequestAccount1 = await algop.balanceOf(accounts[1]);
    expect(balanceAfterRequestAccount1.toString()).to.be.equal('0', 'fail to check payment #0 account #1');
    expect(remainingAmount.toString()).to.be.equal('6000000000000000000', 'fail to check remaining amount #0 account #1');

    console.log('Waiting 10s to first payment');
    sleep.sleep(10);

    await timelock.requestPayment({ from: accounts[1] });
    remainingAmount = await timelock.getRemainingAmount(accounts[1]);
    balanceAfterRequestAccount1 = await algop.balanceOf(accounts[1]);
    expect(balanceAfterRequestAccount1.toString()).to.be.equal('1000000000000000000', 'fail to check payment #1 account #1');
    expect(remainingAmount.toString()).to.be.equal('5000000000000000000', 'fail to check remaining amount #1 account #1');

    console.log('Waiting 10s to second payment');
    sleep.sleep(10);

    await timelock.requestPayment({ from: accounts[1] });

    balanceAfterRequestAccount1 = await algop.balanceOf(accounts[1]);
    remainingAmount = await timelock.getRemainingAmount(accounts[1]);
    expect(balanceAfterRequestAccount1.toString()).to.be.equal('3000000000000000000', 'fail to check payment #2 account #1');
    expect(remainingAmount.toString()).to.be.equal('3000000000000000000', 'fail to check remaining amount #2 account #1');

    console.log('Waiting 10s to third payment');
    sleep.sleep(10);

    await timelock.requestPayment({ from: accounts[1] });
    remainingAmount = await await timelock.getRemainingAmount(accounts[1]);
    balanceAfterRequestAccount1 = await algop.balanceOf(accounts[1]);
    expect(balanceAfterRequestAccount1.toString()).to.be.equal('6000000000000000000', 'fail to check payment #3 account #1');
    expect(remainingAmount.toString()).to.be.equal('0', 'fail to check remaining amount #3 account #1');
  });

  it('should fail to do a emergency withdrawal before the specified time', async () => {
    const now = new Date();
    now.setSeconds(now.getSeconds() + 20);
    
    const algop = await AlgoPainterToken.new('AlgoPainter Token', 'ALGOP');
    const timelock = await AlgoPainterTimeLock.new(algop.address, Math.floor(now / 1000));
    
    await algop.transfer(timelock.address, web3.utils.toWei('10000', 'ether'));

    try {
      await timelock.emergencyWithdraw(web3.utils.toWei('10000', 'ether'));
      throw {};
    } catch (e) {
      expect(e.reason).to.be.equal('IT IS NOT ALLOWED');
    }
  });

  it('should fail to do a emergency withdrawal before the specified time', async () => {
    const now = new Date();
    now.setSeconds(now.getSeconds() + 20);
    
    const algop = await AlgoPainterToken.new('AlgoPainter Token', 'ALGOP');
    const timelock = await AlgoPainterTimeLock.new(algop.address, Math.floor(now / 1000));
    
    await algop.transfer(timelock.address, web3.utils.toWei('10000', 'ether'));

    try {
      await timelock.emergencyWithdraw(web3.utils.toWei('10000', 'ether'));
      throw {};
    } catch (e) {
      expect(e.reason).to.be.equal('IT IS NOT ALLOWED');
    }
  });

  it('should do a emergency withdrawal after the specified time', async () => {
    const now = new Date();
    now.setSeconds(now.getSeconds() + 20);
    
    const algop = await AlgoPainterToken.new('AlgoPainter Token', 'ALGOP');
    const timelock = await AlgoPainterTimeLock.new(algop.address, Math.floor(now / 1000));
    
    await algop.transfer(timelock.address, web3.utils.toWei('100000000', 'ether'));
    let balance = await algop.balanceOf(accounts[0]);
    expect(balance.toString()).to.be.equal('0', 'fail to check the balance after transfer');


    console.log('Waiting 20s to emergencyWithdraw');
    sleep.sleep(20);
    await timelock.emergencyWithdraw(web3.utils.toWei('100000000', 'ether'));
    balance = await algop.balanceOf(accounts[0]);
    expect(balance.toString()).to.be.equal( web3.utils.toWei('100000000', 'ether').toString(), 'fail to check the balance after emergency withdraw');
  });

  it.only('should schedule several payments for several accounts and request payment for each of them', async () => {
    const now = new Date();
    now.setSeconds(now.getSeconds() + 20);
    
    const algop = await AlgoPainterToken.new('AlgoPainter Token', 'ALGOP');
    const timelock = await AlgoPainterTimeLock.new(algop.address, Math.floor(now / 1000).toString());
    
    await algop.transfer(timelock.address, web3.utils.toWei('1000', 'ether'));

    const scheduledDate = await timelock.getNow();

    for (let i = 1; i < 10; i++) {
      await timelock.schedulePayment(accounts[i], await timelock.addSeconds(scheduledDate, 10), web3.utils.toWei(i.toString(), 'ether'));
      await timelock.schedulePayment(accounts[i], await timelock.addSeconds(scheduledDate, 20), web3.utils.toWei(i.toString(), 'ether'));
    }
   
    for (let i = 1; i < 10; i++) {
      await timelock.requestPayment({ from: accounts[i] });
      const balance = await algop.balanceOf(accounts[i]);
      expect(balance.toString()).to.be.equal('0', `fail to check #${i}`);
    }

    console.log('Waiting 10s to request payment #1');
    sleep.sleep(10);

    for (let i = 1; i < 10; i++) {
      await timelock.requestPayment({ from: accounts[i] });
      const balance = await algop.balanceOf(accounts[i]);
      expect(balance.toString()).to.be.equal(web3.utils.toWei(i.toString()), `fail to check #${i} #2`);
    }

    console.log('Waiting 10s to request payment #1');
    sleep.sleep(10);

    for (let i = 1; i < 10; i++) {
      await timelock.requestPayment({ from: accounts[i] });
      const balance = await algop.balanceOf(accounts[i]);
      expect(balance.toString()).to.be.equal(web3.utils.toWei((i+i).toString()), `fail to check #${i} #3`);
    }
  });
});
