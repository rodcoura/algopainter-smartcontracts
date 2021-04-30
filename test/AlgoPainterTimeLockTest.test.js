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

  it('should schedule several payments for several accounts and request payment for each of them', async () => {
    const now = new Date();
    now.setSeconds(now.getSeconds() + 20);
    
    const algop = await AlgoPainterToken.new('AlgoPainter Token', 'ALGOP');
    const timelock = await AlgoPainterTimeLock.new(algop.address, Math.floor(now / 1000).toString());
    
    await algop.transfer(timelock.address, web3.utils.toWei('1000', 'ether'));

    expect((await timelock.getEmergencyWithdrawLimit()).toString()).to.be.equal(Math.floor(now / 1000).toString(), 'fail to check emergency withdraw release time');

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

  it('should schedule several payments using schedulePayments', async () => {
    const now = new Date();
    now.setSeconds(now.getSeconds() + 20);
    
    const algop = await AlgoPainterToken.new('AlgoPainter Token', 'ALGOP');
    const timelock = await AlgoPainterTimeLock.new(algop.address, Math.floor(now / 1000).toString());

    const ref = await timelock.getNow();

    await algop.transfer(timelock.address, web3.utils.toWei('1000', 'ether'));

    for (let i = 1; i <= 9; i++) {
      await timelock.schedulePayments(await timelock.addSeconds(ref, 10), await timelock.getSecondInterval(10), 0, 3, accounts[i], web3.utils.toWei(i.toString(), 'ether'));
    }

    for (let i = 1; i <= 9; i++) {
      const remainingAmount = await timelock.getRemainingAmount(accounts[i]);
      expect(remainingAmount.toString()).to.be.equal(web3.utils.toWei((3 * i).toString(), 'ether'), `fail to check accounts[${i}] remaining amount`);
    }
    
    for (let i = 1; i <= 3; i++) {
      console.log(`Waiting payment ${i}`);
      sleep.sleep(10);

      for (let j = 1; j <= 9; j++) {
        await timelock.requestPayment({ from: accounts[j] });
        const balance = await algop.balanceOf(accounts[j]);
        expect(balance.toString()).to.be.equal(web3.utils.toWei((i*j).toString()).toString(), `fail to check balance account #${j} payment #${i}`);
      }
    }
  });

  it.only('should schedule several payments using schedulePayments with cliff/vesting', async () => {
    const now = new Date();
    now.setSeconds(now.getSeconds() + 20);
    
    const algop = await AlgoPainterToken.new('AlgoPainter Token', 'ALGOP');
    const timelock = await AlgoPainterTimeLock.new(algop.address, Math.floor(now / 1000).toString());

    const ref = await timelock.getNow();

    await algop.transfer(timelock.address, web3.utils.toWei('1000', 'ether'));

    await timelock.schedulePayments(await timelock.addSeconds(ref, 10), await timelock.getSecondInterval(10), 2, 6, accounts[1], web3.utils.toWei('1', 'ether'));

    await timelock.requestPayment({ from: accounts[1] });
    let balance = await algop.balanceOf(accounts[1]);
    let remainingAmount = await timelock.getRemainingAmount(accounts[1]);
    expect(remainingAmount.toString()).to.be.equal('6000000000000000000', 'remaining amount #0 period');
    expect(balance.toString()).to.be.equal('0', '');

    console.log(`Waiting period #1`);
    sleep.sleep(10);
    await timelock.requestPayment({ from: accounts[1] });
    balance = await algop.balanceOf(accounts[1]);
    remainingAmount = await timelock.getRemainingAmount(accounts[1]);
    expect(remainingAmount.toString()).to.be.equal('6000000000000000000', 'remaining amount #1 period');
    expect(balance.toString()).to.be.equal('0', '');

    console.log(`Waiting period #2`);
    sleep.sleep(10);
    await timelock.requestPayment({ from: accounts[1] });
    balance = await algop.balanceOf(accounts[1]);
    remainingAmount = await timelock.getRemainingAmount(accounts[1]);
    expect(remainingAmount.toString()).to.be.equal('4000000000000000000', 'remaining amount #2 period');
    expect(balance.toString()).to.be.equal('2000000000000000000', '');

    console.log(`Waiting period #3`);
    sleep.sleep(10);
    await timelock.requestPayment({ from: accounts[1] });
    balance = await algop.balanceOf(accounts[1]);
    remainingAmount = await timelock.getRemainingAmount(accounts[1]);
    expect(remainingAmount.toString()).to.be.equal('3000000000000000000', 'remaining amount #3 period');
    expect(balance.toString()).to.be.equal('3000000000000000000', '');

    console.log(`Waiting period #4`);
    sleep.sleep(10);
    await timelock.requestPayment({ from: accounts[1] });
    balance = await algop.balanceOf(accounts[1]);
    remainingAmount = await timelock.getRemainingAmount(accounts[1]);
    expect(remainingAmount.toString()).to.be.equal('2000000000000000000', 'remaining amount #4 period');
    expect(balance.toString()).to.be.equal('4000000000000000000', '');

    console.log(`Waiting period #5`);
    sleep.sleep(10);
    await timelock.requestPayment({ from: accounts[1] });
    balance = await algop.balanceOf(accounts[1]);
    remainingAmount = await timelock.getRemainingAmount(accounts[1]);
    expect(remainingAmount.toString()).to.be.equal('1000000000000000000', 'remaining amount #4 period');
    expect(balance.toString()).to.be.equal('5000000000000000000', '');

    console.log(`Waiting period #6`);
    sleep.sleep(10);
    await timelock.requestPayment({ from: accounts[1] });
    balance = await algop.balanceOf(accounts[1]);
    remainingAmount = await timelock.getRemainingAmount(accounts[1]);
    expect(remainingAmount.toString()).to.be.equal('0', 'remaining amount #4 period');
    expect(balance.toString()).to.be.equal('6000000000000000000', '');
  });
});
