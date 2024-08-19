'use strict';

import * as tp from './torrent-parser.js';

export default class{
    constructor(torrent){
        function buildPiecesArray(){
            const nPieces = torrent.info.pieces.length/20;
            const arr = new Array(nPieces).fill(null);
            return arr.map((_, i) => new Array(to.blocksPerPieces(torrent, i)).fill(false));
        }

        this._requested = buildPiecesArray();
        this._received = buildPiecesArray();

    }

    addRequested(pieceBlock){
        const blockIndex = pieceBlock.begin/tp.BLOCK_LEN;
        this._received[pieceBlock.index][blockIndex] = true;
    }

    needed(piecesBlock){
        if(this._requested.every(blocks => blocks.every(i => i))){
            this._requested = this._received.map(blocks => blocks.slice());
        }
        const blockIndex = piecesBlock.begin / tp.BLOCK_LEN;
        return !this._requested[piecesBlock.index][blockIndex];
    }
    isDone(){
        return this._received.every(blocks => blocks.every(i => i));
    }
};