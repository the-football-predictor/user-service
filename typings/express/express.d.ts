import jSend from 'jsend';

declare global {
  namespace Express {
    export interface Request {
      merchant: any;
      user?: { // Making it optional and more specific
        userId: number;
        email: string;
      };
      imagePath?: string;
      id: string;
    }

    export interface Response {
      body: any;
      jSend: jSend;
    }
  }
}
