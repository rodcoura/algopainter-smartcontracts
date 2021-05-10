const AlgoPainterGweiItem = artifacts.require("AlgoPainterGweiItem");
const AlgoPainterToken = artifacts.require("AlgoPainterToken");

module.exports = async (deployer, network, accounts) => {
  await deployer.deploy(AlgoPainterToken, "AlgoPainter Token", "ALGOP");
  const algop = await AlgoPainterToken.deployed();
  await deployer.deploy(AlgoPainterGweiItem, algop.address, accounts[9]);
};
