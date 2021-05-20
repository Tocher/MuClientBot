// 12113600 00000CBE 093FB2FE 5DE28C64 D393C293 DF208E93 083FD38D 5CE2A449 D29322AD DE2054F5 083F75D9 5CE2A659 D29311EF DE20

// this.RingBuffer[0] = ((keys[8] ^ this.CryptBuffer[0]) * keys[4]) % keys[0];
// this.RingBuffer[1] = ((keys[9] ^ (this.CryptBuffer[1] ^ (this.RingBuffer[0] & 0xFFFF))) * keys[5]) % keys[1];
// this.RingBuffer[2] = ((keys[10] ^ (this.CryptBuffer[2] ^ (this.RingBuffer[1] & 0xFFFF))) * keys[6]) % keys[2];
// this.RingBuffer[3] = ((keys[11] ^ (this.CryptBuffer[3] ^ (this.RingBuffer[2] & 0xFFFF))) * keys[7]) % keys[3];

// this.CryptBuffer[0] = (ushort)(keys[8] ^ ((this.RingBuffer[0] * keys[4]) % keys[0]));
// this.CryptBuffer[1] = (ushort)(keys[9] ^ ((this.RingBuffer[1] * keys[5]) % keys[1]) ^ (this.RingBuffer[0] & 0xFFFF));
// this.CryptBuffer[2] = (ushort)(keys[10] ^ ((this.RingBuffer[2] * keys[6]) % keys[2]) ^ (this.RingBuffer[1] & 0xFFFF));
// this.CryptBuffer[3] = (ushort)(keys[11] ^ ((this.RingBuffer[3] * keys[7]) % keys[3]) ^ (this.RingBuffer[2] & 0xFFFF));

// encrypt(inputdec ) -> inputdec * kenc (mod m)
//
// decrypt(inputenc ) -> inputenc * kdec (mod m)
// kenc * kdec (mod m) = 1
