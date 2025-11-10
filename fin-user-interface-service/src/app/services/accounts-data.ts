import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AccountsData {
  private apiUrl = 'http://localhost:3002'; // Replace with your API URL

  constructor(private http: HttpClient) { }

  getData(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  postData(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }

  // Add other methods for PUT, DELETE, etc. as needed
}
