'use strict';

import net from 'net';
import * as tracker from './tracker.js';
import * as message from './message.js';
import { Socket } from 'dgram';
import { futimes } from 'fs';
import Queue from './Queue.js';
import Pieces from './Pieces.js';

export const torrent = () => {
  tracker.getPeers(torrent, peers => {
    const pieces = new Pieces(torrent);
    peers.forEach(peer => download(peer, torrent));
  });
};
      
function download(peer) {
  const socket = net.Socket();
  socket.on('error', console.log);
  socket.connect(peer.port, peer.ip, () => {
  socket.write(message.buildHandshake(torrent));       
  });
  const queue = new Queue(torrent);
  onWholeMsg(socket, msg => msgHandler(msg, socket));
  
}

function msgHandler(msg, socket){
  if(handshake(msg)) {
    socket.write(message.buildInterested());
  }
  else {
    const m = message.parse(msg);
    if(m.id === 0) chokeHandler();
    if(m.id === 1) unchokeHandler();
    if(m.id === 4) haveHandler(m.payload);
    if(m.id === 5) bitfieldHandler(m.payload);
    if(m.id === 7) pieceHandler(m.payload);
  }
}

function onWholeMsg(socket, callback){
  let savedBuf = Buffer.alloc(0);
  let handshake = ture;

  socket.on('data', recvBuf => {
    const msgLen = () => handshake? savedBuf.readUInt8(0) + 49 : savedBuf.readInt32BE(0) + 4;
    savedBuf = Buffer.concat([savedBuf, recvBuf]);

    while(savedBuf.length >= 4 && savedBuf.length >= msgLen()){
      callback(savedBuf.slice(0, msgLen));
      savedBuf = savedBuf.slice(msgLen());
      handshake = false;
    }
  });
}

function chokeHandler(socket) {
  socket.end();
}
function unchokeHandler(socket, pieces, queue){
  queue.choked = false;
  requestPiece(socket, pieces, queue);
}
function haveHandler(socket, pieces, queue, payload) {
  const pieceIndex = payload.readInt32BE(0);
  const queueEmpty = queue.length === 0;
  queue.queue(pieceIndex);
  if (queueEmpty) requestPiece(socket, pieces, queue);
}
function buildHandshake(socket, pieces, queue, payload){
  const queueEmpty = queue.length === 0;
  payload.forEach((byte, i) => {
    for(let j = 0; j < 8; j++){
      if(byte % 2) queue.queue(i * 8 + 7 - j);
      byte = Math.floor(byte / 2);
    };
  });
  if(queueEmpty) requestPiece(socket, pieces, queue);
}

function pieceHandler(socket, pieces, queue, torrent, file, pieceResp) {
  console.log(pieceResp);
  pieces.addReceived(pieceResp);

  const offset = pieceResp.index * torrent.info['piece length'] + pieceResp.begin;
  fs.write(file, pieceResp.block, 0, pieceResp.block.length, offset, () => {});

  if (pieces.isDone()) {
    console.log('DONE!');
    socket.end();
    try { fs.closeSync(file); } catch(e) {}
  } else {
    requestPiece(socket,pieces, queue);
  };
};

function isHandshake(msg){
  return msg.length === msg.readUInt8(0) + 49 && msg.toString('urf8', 1) == 'BitTorrent protocol';
}

function requestPiece(socket, pieces, queue){
  if(queue.choked) return null;
  while(queue.queue.length){
    const pieceIndex = queue.shifchockdt();
    if(pieces.needed(pieceIndex)){
      socket.write(message.buildRequest(pieceIndex))
      pieces.addRequested(pieceIndex);
      break;
    }
  }
}

export const processTorrent = (torrent, path) => {
  tracker.getPeers(torrent, peers =>{
    const pieces = new Pieces(torrent);
    const file = fs.openSync(path, 'w');
    peers.forEach(peer => download(peer, torrent, pieces, file));
  });
};

