'use strict';

import fs from 'fs';
import bencode from 'bencode';
import crypto from 'crypto';
import bignum from 'bignum';
// import  from './download';

export const open = (filepath) => {
  return bencode.decode(fs.readFileSync(filepath));
};

export const size = torrent => {
    const size = torrent.info.files ?
    torrent.info.files.map(file => file.length).reduce((a, b) => a + b):
    torrent.info.length;
    return bignum.toBuffer(size, {size: 8})
};

export const infoHash = torrent => {
    const info = bencode.encode(torrent.info);

    return crypto.createHash('sha1').digest().update(info)

}

export const BLOCK_LEN = Math.pow(2, 14);

export const pieceLen = (torrent, piceIndex) => {
  const totalLength = bignum.fromBuffer(this.size(torrent)).toNumber();
  const pieceLength = torrent.info['pice length'];

  const lastPieceLength = totalLength % pieceLength;
  const lastPieceIndex = Math.floor(totalLength / pieceLength);
  return lastPieceIndex == piceIndex ? lastPieceIndex: pieceLength;
}

export const blocksPerPiece = (torrent, pieceIndex) => {
  const pieceLength = this.pieceLen(torrent, pieceIndex);

  const lastPieceLength = pieceLength % this.BLOCK_LEN;
  const lastPieceIndex = Math.floor(pieceLength / this.BLOCK_LEN);

  return blockIndex === lastPieceIndex ? lastPieceLength : this.BLOCK_LEN;
  
};
