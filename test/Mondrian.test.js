// test/Mondrian.test.js
const { expect } = require('chai');
const { BN, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const NonFungibleSoup = artifacts.require('NonFungibleSoup');
const Mondrian = artifacts.require('Mondrian');

// Start test block
contract('Mondrian', function ([owner, other]) {

  const unsetPrime = new BN('5867');
  const exampleURI = 'ipfs://myipfshash/';
  const examplePrime = new BN('911');

  beforeEach(async function () {
    this.nfs = await NonFungibleSoup.new({from: owner})
    this.mnd = await Mondrian.new(this.nfs.address, {from: owner});
  });

  // default checks

  it('sales are paused upon launch', async function () {
    await expect(
      await this.mnd.salesActive()
    ).to.equal(false);
  });

  it('soup hodlers mode is enabled upon launch', async function () {
    await expect(
      await this.mnd.soupHodlersMode()
    ).to.equal(true);
  });

  it('placeholders are enabled upon launch', async function () {
    await expect(
      await this.mnd.placeholderEnabled()
    ).to.equal(true);
  });

  // ownership checks

  it('non owner cannot toggle contract boolean states', async function () {
    await expectRevert(
      this.mnd.toggleSale({from: other}),
      'Ownable: caller is not the owner',
    );
    await expectRevert(
      this.mnd.toggleSHM({from: other}),
      'Ownable: caller is not the owner',
    );
    await expectRevert(
      this.mnd.togglePlaceholder({from: other}),
      'Ownable: caller is not the owner',
    );
  });

  it('non owner cannot set the random prime number, temp URI, or base URI', async function () {
    await expectRevert(
      this.mnd.setRandPrime(911, {from: other}),
      'Ownable: caller is not the owner',
    );
    await expectRevert(
      this.mnd.setTempURI("ipfs://mynewhash", {from: other}),
      'Ownable: caller is not the owner',
    );
    await expectRevert(
      this.mnd.setBaseURI("ipfs://mynewhash", {from: other}),
      'Ownable: caller is not the owner',
    );
  });

  // toggle func checks

  it('toggleSale function changes salesActive bool', async function () {
    await this.mnd.toggleSale();
    await expect(
      await this.mnd.salesActive()
    ).to.equal(true);
    await this.mnd.toggleSale();
    await expect(
      await this.mnd.salesActive()
    ).to.equal(false);
  });

  it('toggleSHM function changes soupHodlersMode bool', async function () {
    await this.mnd.toggleSHM();
    await expect(
      await this.mnd.soupHodlersMode()
    ).to.equal(false);
    await this.mnd.toggleSHM();
    await expect(
      await this.mnd.soupHodlersMode()
    ).to.equal(true);
  });

  it('toggleSHM function changes soupHodlersMode bool', async function () {
    await this.mnd.togglePlaceholder();
    await expect(
      await this.mnd.placeholderEnabled()
    ).to.equal(false);
    await this.mnd.togglePlaceholder();
    await expect(
      await this.mnd.placeholderEnabled()
    ).to.equal(true);
  });

  // setRandPrime func checks

  it('setRandPrime function will set RAND_PRIME variable', async function () {
    await this.mnd.setRandPrime(examplePrime);
    await expect(
      await this.mnd.RAND_PRIME()
    ).to.be.bignumber.equal(examplePrime);
  });

  it('setRandPrime function will only allow being set one time', async function () {
    await this.mnd.setRandPrime(examplePrime);
    await this.mnd.setRandPrime(unsetPrime);
    await expect(
      await this.mnd.RAND_PRIME()
    ).to.be.bignumber.equal(examplePrime);
  });

  // setBaseURI/setTempURI func checks

  it('setBaseURI function will set new metadata URI for NFTs', async function () {
    await this.mnd.togglePlaceholder();
    await this.mnd.setBaseURI(exampleURI);
    await expect(
      await this.mnd.tokenURI(1)
    ).to.equal(exampleURI + '1');
    await expect(
      await this.mnd.tokenURI(2048)
    ).to.equal(exampleURI + '2048');
  });

  it('setTempURI function will set new metadata URI for NFTs', async function () {
    await this.mnd.setTempURI(exampleURI);
    await expect(
      await this.mnd.tokenURI(1)
    ).to.equal(exampleURI);
    await expect(
      await this.mnd.tokenURI(2048)
    ).to.equal(exampleURI);
  });

  // checkTokenIsMinted func checks

  it('checkTokenIsMinted function will return false for unminted token Ids', async function () {
    await expect(
      await this.mnd.checkTokenIsMinted(1)
    ).to.equal(false);
  });

  it('checkTokenIsMinted function will return true for minted token Ids', async function () {
    await this.mnd.setRandPrime(examplePrime);
    await this.mnd.toggleSHM();
    await this.mnd.toggleSale();
    await this.mnd.mintItem(1, [], {value: 0});
    let tokenId = await this.mnd.getTokenId(1);
    await expect(
      await this.mnd.checkTokenIsMinted(tokenId)
    ).to.equal(true);
  });

  it('checkTokenIsMinted function will revert if provided Id is outside of expected range', async function () {
    await expectRevert(
      this.mnd.checkTokenIsMinted(4097),
      'Provided tokenId is not allowed'
    );
    await expectRevert(
      this.mnd.checkTokenIsMinted(6000),
      'Provided tokenId is not allowed'
    );
  });

  // checkIndexIsMinted func checks

  it('checkIndexIsMinted function will return false for unminted token indexes', async function () {
    await expect(
      await this.mnd.checkIndexIsMinted(1)
    ).to.equal(false);
  });

  it('checkIndexIsMinted function will return true for minted token indexes', async function () {
    await this.mnd.setRandPrime(examplePrime);
    await this.mnd.toggleSHM();
    await this.mnd.toggleSale();
    await this.mnd.mintItem(1, [], {value: 0});
    await expect(
      await this.mnd.checkIndexIsMinted(1)
    ).to.equal(true);
  });

  it('checkIndexIsMinted function will revert if provided index is outside of expected range', async function () {
    await expectRevert(
      this.mnd.checkIndexIsMinted(4097),
      'Provided token index is not allowed'
    );
  });

  // mintItem func checks

  it('mintItem function will revert if tokenIds list is empty', async function () {
    await this.mnd.setRandPrime(examplePrime);
    await this.mnd.toggleSale();
    await expectRevert(
      this.mnd.mintItem(1, [], {value: 0}),
      'Must provide at least 1 token id'
    );
  });

  it('mintItem function will revert if RAND_PRIME not set', async function () {
    await this.mnd.toggleSHM();
    await this.mnd.toggleSale();
    await expectRevert(
      this.mnd.mintItem(1, [], {value: 0}),
      'Random prime number has not been defined.'
    );
  });

  it('mintItem function will revert if salesActive is false', async function () {
    await this.mnd.setRandPrime(examplePrime);
    await this.mnd.toggleSHM();
    await expect(
      await this.mnd.salesActive()
    ).to.equal(false);
    await expectRevert(
      this.mnd.mintItem(1, [], {value: 0}),
      'Sale must be active'
    );
  });

  it('mintItem function will revert if numberOfTokens arg exceeds max', async function () {
    await this.mnd.setRandPrime(examplePrime);
    await this.mnd.toggleSHM();
    await this.mnd.toggleSale();
    await expectRevert(
      this.mnd.mintItem(4, [], {value: 0}),
      'Can only mint 3 items at a time'
    );
  });

  it('mintItem function will mint only up to 2048 items with soupHodlersMode enabled', async function () {
    this.timeout(0); // dont timeout for this long test

    // Mint all the NFS tokens
    console.log(`Mint all the NFS tokens to test owner account`);
    await this.nfs.setRandPrime(examplePrime);
    for (i = 0; i < 1024; i++) {
      let res = await this.nfs.mintItem(2, {value: 0});
      await expectEvent(
        res, 'Transfer'
      );
    }

    // Check that one cannot mint without ownership of a given soup tokenId
    let checkTokenId = await this.nfs.tokenOfOwnerByIndex(owner, 0)
    console.log(`Confirm that test other account cannot claim ownership of owner soup tokenId: ${checkTokenId}`);
    await expectRevert(
      this.mnd.mintItem(1, [checkTokenId], {value: 0, from: other}),
      'Sender is not the owner of provided soup'
    );

    // Begin minting the MND tokens referencing NFS tokens
    console.log(`Minting as many Mondrians as Soups (2048).`);
    await this.mnd.setRandPrime(examplePrime);
    await this.mnd.toggleSale();
    for (i = 0; i < 1024; i++) {
      let tokenId = await this.nfs.tokenOfOwnerByIndex(owner, i);
      let res = await this.mnd.mintItem(2, [tokenId], {value: 0});
      await expectEvent(
        res, 'Transfer'
      );
    }

    // Check that Mondrians fail to mint if soup tokenId is already used
    console.log(`Checking that minting fails if tokenId already registered`);
    await this.nfs.transferFrom(owner, other, checkTokenId)
    await expectRevert(
      this.mnd.mintItem(1, [checkTokenId], {value: 0, from: other}),
      'Token already associated with another sender'
    );

    // We should have 2048 Mondrians at this point but
    // we're unable to proceed until disabling SHM.
    console.log(`Expecting 2048 Mondrians minted by only Soup hodlers`);
    await expect(
      (await this.mnd.totalSupply()).toString()
    ).to.equal('2048');
    let tokenId = await this.nfs.tokenOfOwnerByIndex(owner, 2000);

    // Hodlers cant mint more Mondrians than Soups during SHM
    console.log(`Hodlers cant mint more Mondrians than Soups during soupHodlersMode`);
    await expectRevert(
      this.mnd.mintItem(1, [tokenId], {value: 0}),
      'Cannot mint more Mondrians than Soups that exist'
    );

    // Disable SHM
    console.log(`Toggling soupHodlersMode`);
    await this.mnd.toggleSHM();

    // Resume minting mondrians uninhibited as new user
    console.log(`Minting all Mondrians`);
    for (i = 0; i < 1024; i++) {
      let res = await this.mnd.mintItem(2, [] , {value: 0, from: other});
      await expectEvent(
        res, 'Transfer'
      );
    }

    // Try to mint past upper boundaries
    console.log('Ensure it wont exceed max supply');
    await expectRevert(
      this.mnd.mintItem(1, [], {value: 0}),
      'Minting would exceed max supply'
    );
  });

});
