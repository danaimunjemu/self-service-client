import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class JwtDecoderService {

  constructor() {}

  decodeToken(token: string): any | null {
    if (!token) return null;

    try {
      const payload = token.split('.')[1]; // JWT payload is the 2nd part
      const decoded = atob(payload);      // base64 decode
      return JSON.parse(decoded);         // parse to JSON
    } catch (error) {
      return null;
    }
  }

  getIssuedAt(token: string): number | null {
    const payload = this.decodeToken(token);
    return payload?.iat ?? null;
  }

  getExpiration(token: string): number | null {
    const payload = this.decodeToken(token);
    return payload?.exp ?? null;
  }
}
