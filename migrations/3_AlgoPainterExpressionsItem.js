const AlgoPainterExpressionsItem = artifacts.require("AlgoPainterExpressionsItem");

module.exports = async (deployer, network, accounts) => {
  await deployer.deploy(AlgoPainterExpressionsItem, accounts[9], accounts[8]);
};
