/**
 *  usage: npx hardhat run scripts/writer.js
 */
function main() {
  var fs = require("fs");
  var CID = "QmPGaVutQSUP6Yjtc6FkPzFVGXeLZ6EhA1N5YQ1gf1Rqen";
  for (i = 0; i < 50; i++) {
    var data = {
      name: "Crypto Lovers Genesis #" + (i + 1),
      description:
        "This NFT is the proof you were part of the blockchain history. It will remain there forever and you guys are among the early adopters of crypto, so congratulations to all of you ! Keep having fun with it 😉 Crypto Lovers Telegram Group, created in 2020 by Cryptor / Art work by Xciting",
      image: "ipfs://" + CID,
    };
    fs.writeFile(
      "writer/" + (i + 1) + ".json",
      JSON.stringify(data),
      function (err) {
        if (err) throw err;
      }
    );
  }
}

main();
