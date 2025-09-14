import { Response } from "express";

export interface GuestUser {
  Id: string;
  App: string;
  User__c: string;
  Image_Type: string;
  Login_Type: string;
  Created_At: Date;
}

export interface GuestUserResponse {
  account: number;
  Id: string;
  App: string;
  User: string;
  Image: string;
  Login: string;
  Date: string;
}

export interface ApiResponse {
  message: GuestUserResponse[];
}

export interface Client {
  id: number;
  response: Response;
}

