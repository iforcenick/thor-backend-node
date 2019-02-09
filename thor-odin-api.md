---
title: Thor API
language_tabs:
  - ruby: Ruby
  - python: Python
toc_footers: []
includes: []
search: false
highlight_theme: darkula
headingLevel: 2

---

<h1 id="thor-api">Thor API v0.5.0</h1>

> Scroll down for code samples, example requests and responses. Select a language for code samples from the tabs above or the mobile navigation menu.

Base URLs:

* <a href="/">/</a>

 License: ISC

# Authentication

* API Key (api_key)
    - Parameter Name: **Authorization**, in: header. 

<h1 id="thor-api-default">Default</h1>

## TenantGetTenantSettings

<a id="opIdTenantGetTenantSettings"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json',
  'Authorization' => 'API_KEY'
}

result = RestClient.get '/tenants/settings',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json',
  'Authorization': 'API_KEY'
}

r = requests.get('/tenants/settings', params={

}, headers = headers)

print r.json()

```

`GET /tenants/settings`

Get the current tenant settings

> Example responses

> 200 Response

```json
{}
```

<h3 id="tenantgettenantsettings-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|Inline|

<h3 id="tenantgettenantsettings-responseschema">Response Schema</h3>

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
api_key
</aside>

## TenantGetTenantCompanyDocuments

<a id="opIdTenantGetTenantCompanyDocuments"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json',
  'Authorization' => 'API_KEY'
}

result = RestClient.get '/tenants/company/documents',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json',
  'Authorization': 'API_KEY'
}

r = requests.get('/tenants/company/documents', params={

}, headers = headers)

print r.json()

```

`GET /tenants/company/documents`

Get the list of documents uploaded for the current tenant company

> Example responses

> 200 Response

```json
[
  {
    "type": "string",
    "status": "string",
    "created": "2019-02-09T08:01:37Z",
    "failureReason": "string"
  }
]
```

<h3 id="tenantgettenantcompanydocuments-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|Inline|

<h3 id="tenantgettenantcompanydocuments-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|*anonymous*|[[TenantCompanyDocument](#schematenantcompanydocument)]|false|none|none|
|» type|string|true|none|none|
|» status|string|true|none|none|
|» created|string(date-time)|true|none|none|
|» failureReason|string|true|none|none|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
api_key
</aside>

## TenantCreateTenantCompanyDocuments

<a id="opIdTenantCreateTenantCompanyDocuments"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Content-Type' => 'multipart/form-data',
  'Accept' => 'application/json',
  'Authorization' => 'API_KEY'
}

result = RestClient.post '/tenants/company/documents',
  params: {
  'type' => 'string'
}, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Content-Type': 'multipart/form-data',
  'Accept': 'application/json',
  'Authorization': 'API_KEY'
}

r = requests.post('/tenants/company/documents', params={
  'type': 'string'
}, headers = headers)

print r.json()

```

`POST /tenants/company/documents`

Upload a document for the current tenant company

> Body parameter

```yaml
filepond: string

```

<h3 id="tenantcreatetenantcompanydocuments-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|type|query|string|true|none|
|body|body|[UserAddUserDwollaDocument](#schemauseradduserdwolladocument)|false|none|
|» filepond|body|string(binary)|true|none|

> Example responses

> 200 Response

```json
{
  "type": "string",
  "status": "string",
  "created": "2019-02-09T08:01:37Z",
  "failureReason": "string"
}
```

<h3 id="tenantcreatetenantcompanydocuments-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|[TenantCompanyDocument](#schematenantcompanydocument)|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
api_key
</aside>

<h1 id="thor-api-auth">auth</h1>

## AuthChangePassword

<a id="opIdAuthChangePassword"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Content-Type' => 'application/json',
  'Authorization' => 'API_KEY'
}

result = RestClient.patch '/auth/password',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Content-Type': 'application/json',
  'Authorization': 'API_KEY'
}

r = requests.patch('/auth/password', params={

}, headers = headers)

print r.json()

```

`PATCH /auth/password`

Change your password

> Body parameter

```json
{
  "oldPassword": "string",
  "newPassword": "string"
}
```

<h3 id="authchangepassword-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[ChangePasswordRequest](#schemachangepasswordrequest)|true|none|

<h3 id="authchangepassword-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|204|[No Content](https://tools.ietf.org/html/rfc7231#section-6.3.5)|No content|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
api_key
</aside>

## AuthLogin

<a id="opIdAuthLogin"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Content-Type' => 'application/json',
  'Accept' => 'application/json'
}

result = RestClient.post '/auth/login',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
}

r = requests.post('/auth/login', params={

}, headers = headers)

print r.json()

```

`POST /auth/login`

Authenticate using login and password

> Body parameter

```json
{
  "login": "string",
  "password": "string"
}
```

<h3 id="authlogin-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[LoginRequest](#schemaloginrequest)|true|none|

> Example responses

> 200 Response

```json
{
  "token": "string",
  "id": "string",
  "createdAt": "2019-02-09T08:01:37Z",
  "updatedAt": "2019-02-09T08:01:37Z",
  "lastTransaction": "2019-02-09T08:01:37Z",
  "lastActivity": "2019-02-09T08:01:37Z",
  "rank": 0,
  "prev": 0,
  "tenantProfile": {
    "id": "string",
    "userId": "string",
    "tenantId": "string",
    "paymentsStatus": "string",
    "paymentsType": "string",
    "status": "string",
    "roles": [
      {
        "name": "string"
      }
    ],
    "createdAt": "2019-02-09T08:01:37Z",
    "updatedAt": "2019-02-09T08:01:37Z",
    "firstName": "string",
    "lastName": "string",
    "phone": "string",
    "email": "string",
    "country": "string",
    "state": "string",
    "city": "string",
    "postalCode": "string",
    "address1": "string",
    "address2": "string",
    "dateOfBirth": "2019-02-09T08:01:37Z"
  }
}
```

<h3 id="authlogin-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|[AuthUserResponse](#schemaauthuserresponse)|

<aside class="success">
This operation does not require authentication
</aside>

## AuthRegister

<a id="opIdAuthRegister"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Content-Type' => 'application/json',
  'Accept' => 'application/json'
}

result = RestClient.post '/auth/register',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
}

r = requests.post('/auth/register', params={

}, headers = headers)

print r.json()

```

`POST /auth/register`

Register a new user login using an invitation token

> Body parameter

```json
{
  "invitationToken": "string",
  "email": "string",
  "password": "string"
}
```

<h3 id="authregister-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[RegisterUserRequest](#schemaregisteruserrequest)|true|none|

> Example responses

> 200 Response

```json
{}
```

<h3 id="authregister-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|Inline|

<h3 id="authregister-responseschema">Response Schema</h3>

<aside class="success">
This operation does not require authentication
</aside>

## AuthResetPassword

<a id="opIdAuthResetPassword"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Content-Type' => 'application/json',
  'Accept' => 'application/json'
}

result = RestClient.post '/auth/resetPassword',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
}

r = requests.post('/auth/resetPassword', params={

}, headers = headers)

print r.json()

```

`POST /auth/resetPassword`

Reset your password using a password reset token

> Body parameter

```json
{
  "resetToken": "string",
  "newPassword": "string"
}
```

<h3 id="authresetpassword-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[ResetPasswordRequest](#schemaresetpasswordrequest)|true|none|

> Example responses

> 200 Response

```json
{}
```

<h3 id="authresetpassword-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|Inline|

<h3 id="authresetpassword-responseschema">Response Schema</h3>

<aside class="success">
This operation does not require authentication
</aside>

## AuthGetPasswordResetToken

<a id="opIdAuthGetPasswordResetToken"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get '/auth/resetPassword/{resetToken}',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('/auth/resetPassword/{resetToken}', params={

}, headers = headers)

print r.json()

```

`GET /auth/resetPassword/{resetToken}`

Check that a password reset token is valid

<h3 id="authgetpasswordresettoken-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|resetToken|path|string|true|none|

> Example responses

> 200 Response

```json
{}
```

<h3 id="authgetpasswordresettoken-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|Inline|

<h3 id="authgetpasswordresettoken-responseschema">Response Schema</h3>

<aside class="success">
This operation does not require authentication
</aside>

<h1 id="thor-api-users">users</h1>

## UserGetContractor

<a id="opIdUserGetContractor"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json',
  'Authorization' => 'API_KEY'
}

result = RestClient.get '/users/myself',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json',
  'Authorization': 'API_KEY'
}

r = requests.get('/users/myself', params={

}, headers = headers)

print r.json()

```

`GET /users/myself`

> Example responses

> 200 Response

```json
{
  "id": "string",
  "createdAt": "2019-02-09T08:01:37Z",
  "updatedAt": "2019-02-09T08:01:37Z",
  "lastTransaction": "2019-02-09T08:01:37Z",
  "lastActivity": "2019-02-09T08:01:37Z",
  "rank": 0,
  "prev": 0,
  "tenantProfile": {
    "id": "string",
    "userId": "string",
    "tenantId": "string",
    "paymentsStatus": "string",
    "paymentsType": "string",
    "status": "string",
    "roles": [
      {
        "name": "string"
      }
    ],
    "createdAt": "2019-02-09T08:01:37Z",
    "updatedAt": "2019-02-09T08:01:37Z",
    "firstName": "string",
    "lastName": "string",
    "phone": "string",
    "email": "string",
    "country": "string",
    "state": "string",
    "city": "string",
    "postalCode": "string",
    "address1": "string",
    "address2": "string",
    "dateOfBirth": "2019-02-09T08:01:37Z"
  }
}
```

<h3 id="usergetcontractor-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|[dto.UserResponse](#schemadto.userresponse)|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
api_key
</aside>

## UserGetUser

<a id="opIdUserGetUser"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json',
  'Authorization' => 'API_KEY'
}

result = RestClient.get '/users/{id}',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json',
  'Authorization': 'API_KEY'
}

r = requests.get('/users/{id}', params={

}, headers = headers)

print r.json()

```

`GET /users/{id}`

<h3 id="usergetuser-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id|path|string|true|none|

> Example responses

> 200 Response

```json
{
  "id": "string",
  "createdAt": "2019-02-09T08:01:37Z",
  "updatedAt": "2019-02-09T08:01:37Z",
  "lastTransaction": "2019-02-09T08:01:37Z",
  "lastActivity": "2019-02-09T08:01:37Z",
  "rank": 0,
  "prev": 0,
  "tenantProfile": {
    "id": "string",
    "userId": "string",
    "tenantId": "string",
    "paymentsStatus": "string",
    "paymentsType": "string",
    "status": "string",
    "roles": [
      {
        "name": "string"
      }
    ],
    "createdAt": "2019-02-09T08:01:37Z",
    "updatedAt": "2019-02-09T08:01:37Z",
    "firstName": "string",
    "lastName": "string",
    "phone": "string",
    "email": "string",
    "country": "string",
    "state": "string",
    "city": "string",
    "postalCode": "string",
    "address1": "string",
    "address2": "string",
    "dateOfBirth": "2019-02-09T08:01:37Z"
  }
}
```

<h3 id="usergetuser-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|[dto.UserResponse](#schemadto.userresponse)|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
api_key
</aside>

## UserDelete

<a id="opIdUserDelete"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Authorization' => 'API_KEY'
}

result = RestClient.delete '/users/{id}',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Authorization': 'API_KEY'
}

r = requests.delete('/users/{id}', params={

}, headers = headers)

print r.json()

```

`DELETE /users/{id}`

<h3 id="userdelete-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id|path|string|true|none|

<h3 id="userdelete-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|204|[No Content](https://tools.ietf.org/html/rfc7231#section-6.3.5)|No content|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
api_key
</aside>

## UserGetRatingJobsList

<a id="opIdUserGetRatingJobsList"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json',
  'Authorization' => 'API_KEY'
}

result = RestClient.get '/users/rating/jobs',
  params: {
  'startDate' => 'string(date-time)',
'endDate' => 'string(date-time)'
}, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json',
  'Authorization': 'API_KEY'
}

r = requests.get('/users/rating/jobs', params={
  'startDate': '2019-02-09T08:01:37Z',  'endDate': '2019-02-09T08:01:37Z'
}, headers = headers)

print r.json()

```

`GET /users/rating/jobs`

<h3 id="usergetratingjobslist-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|startDate|query|string(date-time)|true|startDate|
|endDate|query|string(date-time)|true|endDate|
|limit|query|number(double)|false|transactions per page|
|page|query|number(double)|false|page to be queried, starting from 0|
|status|query|string|false|status|
|orderBy|query|string|false|- field name|
|order|query|string|false|- asc|desc|
|contractor|query|string|false|- contractor firstName, lastName or "firstName lastName"|

> Example responses

> 200 Response

```json
{
  "items": [
    {
      "id": "string",
      "rank": 0,
      "firstName": "string",
      "lastName": "string",
      "total": 0,
      "jobsCount": 0,
      "transactionsIds": [
        "string"
      ],
      "jobs": [
        {
          "name": "string",
          "total": 0,
          "jobs": 0,
          "status": "string",
          "id": "string"
        }
      ]
    }
  ],
  "pagination": {
    "total": 0,
    "limit": 0,
    "page": 0,
    "pages": 0
  }
}
```

<h3 id="usergetratingjobslist-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|[dto.PaginatedRankingJobsResponse](#schemadto.paginatedrankingjobsresponse)|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
api_key
</aside>

## UserGetUsersList

<a id="opIdUserGetUsersList"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json',
  'Authorization' => 'API_KEY'
}

result = RestClient.get '/users/',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json',
  'Authorization': 'API_KEY'
}

r = requests.get('/users/', params={

}, headers = headers)

print r.json()

```

`GET /users/`

<h3 id="usergetuserslist-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|page|query|number(double)|false|page to be queried, starting from 0|
|limit|query|number(double)|false|users per page|
|orderBy|query|string|false|- field name|
|order|query|string|false|- asc|desc|
|contractor|query|string|false|- contractor firstName, lastName or "firstName lastName"|
|city|query|string|false|none|
|state|query|string|false|none|

> Example responses

> 200 Response

```json
{
  "items": [
    {
      "id": "string",
      "createdAt": "2019-02-09T08:01:37Z",
      "updatedAt": "2019-02-09T08:01:37Z",
      "lastTransaction": "2019-02-09T08:01:37Z",
      "lastActivity": "2019-02-09T08:01:37Z",
      "rank": 0,
      "prev": 0,
      "tenantProfile": {
        "id": "string",
        "userId": "string",
        "tenantId": "string",
        "paymentsStatus": "string",
        "paymentsType": "string",
        "status": "string",
        "roles": [
          {
            "name": "string"
          }
        ],
        "createdAt": "2019-02-09T08:01:37Z",
        "updatedAt": "2019-02-09T08:01:37Z",
        "firstName": "string",
        "lastName": "string",
        "phone": "string",
        "email": "string",
        "country": "string",
        "state": "string",
        "city": "string",
        "postalCode": "string",
        "address1": "string",
        "address2": "string",
        "dateOfBirth": "2019-02-09T08:01:37Z"
      }
    }
  ],
  "pagination": {
    "total": 0,
    "limit": 0,
    "page": 0,
    "pages": 0
  }
}
```

<h3 id="usergetuserslist-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|[dto.PaginatedUserResponse](#schemadto.paginateduserresponse)|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
api_key
</aside>

## UserDeleteSelf

<a id="opIdUserDeleteSelf"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Authorization' => 'API_KEY'
}

result = RestClient.delete '/users/',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Authorization': 'API_KEY'
}

r = requests.delete('/users/', params={

}, headers = headers)

print r.json()

```

`DELETE /users/`

<h3 id="userdeleteself-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|204|[No Content](https://tools.ietf.org/html/rfc7231#section-6.3.5)|No content|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
api_key
</aside>

## UserPatchAnyUser

<a id="opIdUserPatchAnyUser"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Content-Type' => 'application/json',
  'Accept' => 'application/json',
  'Authorization' => 'API_KEY'
}

result = RestClient.patch '/users/{id}/profile',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': 'API_KEY'
}

r = requests.patch('/users/{id}/profile', params={

}, headers = headers)

print r.json()

```

`PATCH /users/{id}/profile`

> Body parameter

```json
{
  "profile": {
    "firstName": "string",
    "lastName": "string",
    "phone": "string",
    "email": "string",
    "country": "string",
    "state": "string",
    "city": "string",
    "postalCode": "string",
    "address1": "string",
    "address2": "string",
    "dateOfBirth": "2019-02-09T08:01:37Z"
  }
}
```

<h3 id="userpatchanyuser-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id|path|string|true|none|
|body|body|[dto.UserPatchRequest](#schemadto.userpatchrequest)|true|none|

> Example responses

> 200 Response

```json
{
  "id": "string",
  "userId": "string",
  "tenantId": "string",
  "paymentsStatus": "string",
  "paymentsType": "string",
  "status": "string",
  "roles": [
    {
      "name": "string"
    }
  ],
  "createdAt": "2019-02-09T08:01:37Z",
  "updatedAt": "2019-02-09T08:01:37Z",
  "firstName": "string",
  "lastName": "string",
  "phone": "string",
  "email": "string",
  "country": "string",
  "state": "string",
  "city": "string",
  "postalCode": "string",
  "address1": "string",
  "address2": "string",
  "dateOfBirth": "2019-02-09T08:01:37Z"
}
```

<h3 id="userpatchanyuser-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|[ProfileResponse](#schemaprofileresponse)|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
api_key
</aside>

## UserGetUserTransactions

<a id="opIdUserGetUserTransactions"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json',
  'Authorization' => 'API_KEY'
}

result = RestClient.get '/users/{userId}/transactions',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json',
  'Authorization': 'API_KEY'
}

r = requests.get('/users/{userId}/transactions', params={

}, headers = headers)

print r.json()

```

`GET /users/{userId}/transactions`

<h3 id="usergetusertransactions-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|userId|path|string|true|none|
|page|query|number(double)|false|none|
|limit|query|number(double)|false|none|
|startDate|query|string(date-time)|false|none|
|endDate|query|string(date-time)|false|none|
|status|query|string|false|none|

> Example responses

> 200 Response

```json
{
  "items": [
    {
      "id": "string",
      "status": "string",
      "createdAt": "2019-02-09T08:01:37Z",
      "updatedAt": "2019-02-09T08:01:37Z",
      "job": {
        "id": "string",
        "createdAt": "2019-02-09T08:01:37Z",
        "updatedAt": "2019-02-09T08:01:37Z",
        "isActive": true,
        "value": 0,
        "name": "string",
        "description": "string",
        "isCustom": true
      },
      "value": 0,
      "userId": "string"
    }
  ],
  "pagination": {
    "total": 0,
    "limit": 0,
    "page": 0,
    "pages": 0
  }
}
```

<h3 id="usergetusertransactions-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|[transactions.PaginatedTransactionResponse](#schematransactions.paginatedtransactionresponse)|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
api_key
</aside>

## UserGetJobs

<a id="opIdUserGetJobs"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json',
  'Authorization' => 'API_KEY'
}

result = RestClient.get '/users/{userId}/statistics',
  params: {
  'currentStartDate' => 'string',
'currentEndDate' => 'string',
'previousStartDate' => 'string',
'previousEndDate' => 'string'
}, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json',
  'Authorization': 'API_KEY'
}

r = requests.get('/users/{userId}/statistics', params={
  'currentStartDate': 'string',  'currentEndDate': 'string',  'previousStartDate': 'string',  'previousEndDate': 'string'
}, headers = headers)

print r.json()

```

`GET /users/{userId}/statistics`

<h3 id="usergetjobs-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|userId|path|string|true|none|
|currentStartDate|query|string|true|none|
|currentEndDate|query|string|true|none|
|previousStartDate|query|string|true|none|
|previousEndDate|query|string|true|none|

> Example responses

> 200 Response

```json
{
  "rank": 0,
  "nJobs": 0,
  "prev": 0,
  "current": 0,
  "ytd": 0
}
```

<h3 id="usergetjobs-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|[dto.UserStatisticsResponse](#schemadto.userstatisticsresponse)|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
api_key
</aside>

## UserCreateAdminUser

<a id="opIdUserCreateAdminUser"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Content-Type' => 'application/json',
  'Accept' => 'application/json',
  'Authorization' => 'API_KEY'
}

result = RestClient.post '/users/admins',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': 'API_KEY'
}

r = requests.post('/users/admins', params={

}, headers = headers)

print r.json()

```

`POST /users/admins`

Endpoint to create a new admin user account

> Body parameter

```json
{
  "profile": {
    "firstName": "string",
    "lastName": "string",
    "email": "string",
    "role": "string"
  }
}
```

<h3 id="usercreateadminuser-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[dto.AdminUserRequest](#schemadto.adminuserrequest)|true|none|

> Example responses

> 200 Response

```json
{
  "id": "string",
  "createdAt": "2019-02-09T08:01:37Z",
  "updatedAt": "2019-02-09T08:01:37Z",
  "lastTransaction": "2019-02-09T08:01:37Z",
  "lastActivity": "2019-02-09T08:01:37Z",
  "rank": 0,
  "prev": 0,
  "tenantProfile": {
    "id": "string",
    "userId": "string",
    "tenantId": "string",
    "paymentsStatus": "string",
    "paymentsType": "string",
    "status": "string",
    "roles": [
      {
        "name": "string"
      }
    ],
    "createdAt": "2019-02-09T08:01:37Z",
    "updatedAt": "2019-02-09T08:01:37Z",
    "firstName": "string",
    "lastName": "string",
    "phone": "string",
    "email": "string",
    "country": "string",
    "state": "string",
    "city": "string",
    "postalCode": "string",
    "address1": "string",
    "address2": "string",
    "dateOfBirth": "2019-02-09T08:01:37Z"
  }
}
```

<h3 id="usercreateadminuser-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|[dto.UserResponse](#schemadto.userresponse)|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
api_key
</aside>

## UserAddContractorUser

<a id="opIdUserAddContractorUser"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Content-Type' => 'application/json',
  'Accept' => 'application/json',
  'Authorization' => 'API_KEY'
}

result = RestClient.post '/users/contractors',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': 'API_KEY'
}

r = requests.post('/users/contractors', params={

}, headers = headers)

print r.json()

```

`POST /users/contractors`

Endpoint to create a new contractor user

> Body parameter

```json
{
  "profile": {
    "ssn": "string",
    "externalId": "string",
    "firstName": "string",
    "lastName": "string",
    "phone": "string",
    "email": "string",
    "country": "string",
    "state": "string",
    "city": "string",
    "postalCode": "string",
    "address1": "string",
    "address2": "string",
    "dateOfBirth": "2019-02-09T08:01:37Z"
  }
}
```

<h3 id="useraddcontractoruser-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[dto.AddContractorUserRequest](#schemadto.addcontractoruserrequest)|true|none|

> Example responses

> 200 Response

```json
{
  "id": "string",
  "createdAt": "2019-02-09T08:01:37Z",
  "updatedAt": "2019-02-09T08:01:37Z",
  "lastActivity": "2019-02-09T08:01:37Z",
  "tenantProfile": {
    "id": "string",
    "userId": "string",
    "tenantId": "string",
    "paymentsStatus": "string",
    "paymentsType": "string",
    "status": "string",
    "roles": [
      {
        "name": "string"
      }
    ],
    "createdAt": "2019-02-09T08:01:37Z",
    "updatedAt": "2019-02-09T08:01:37Z",
    "firstName": "string",
    "lastName": "string",
    "phone": "string",
    "email": "string",
    "country": "string",
    "state": "string",
    "city": "string",
    "postalCode": "string",
    "address1": "string",
    "address2": "string",
    "dateOfBirth": "2019-02-09T08:01:37Z"
  },
  "token": "string"
}
```

<h3 id="useraddcontractoruser-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|[dto.AddContractorUserResponse](#schemadto.addcontractoruserresponse)|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
api_key
</aside>

## UserAddContractorOnRetry

<a id="opIdUserAddContractorOnRetry"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Content-Type' => 'application/json',
  'Accept' => 'application/json',
  'Authorization' => 'API_KEY'
}

result = RestClient.put '/users/{userId}',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': 'API_KEY'
}

r = requests.put('/users/{userId}', params={

}, headers = headers)

print r.json()

```

`PUT /users/{userId}`

> Body parameter

```json
{
  "profile": {
    "firstName": "string",
    "lastName": "string",
    "phone": "string",
    "email": "string",
    "country": "string",
    "state": "string",
    "city": "string",
    "postalCode": "string",
    "address1": "string",
    "address2": "string",
    "dateOfBirth": "2019-02-09T08:01:37Z"
  }
}
```

<h3 id="useraddcontractoronretry-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|userId|path|string|true|none|
|body|body|[dto.ContractorOnRetryRequest](#schemadto.contractoronretryrequest)|true|none|

> Example responses

> 200 Response

```json
{
  "id": "string",
  "createdAt": "2019-02-09T08:01:37Z",
  "updatedAt": "2019-02-09T08:01:37Z",
  "lastActivity": "2019-02-09T08:01:37Z",
  "tenantProfile": {
    "id": "string",
    "userId": "string",
    "tenantId": "string",
    "paymentsStatus": "string",
    "paymentsType": "string",
    "status": "string",
    "roles": [
      {
        "name": "string"
      }
    ],
    "createdAt": "2019-02-09T08:01:37Z",
    "updatedAt": "2019-02-09T08:01:37Z",
    "firstName": "string",
    "lastName": "string",
    "phone": "string",
    "email": "string",
    "country": "string",
    "state": "string",
    "city": "string",
    "postalCode": "string",
    "address1": "string",
    "address2": "string",
    "dateOfBirth": "2019-02-09T08:01:37Z"
  }
}
```

<h3 id="useraddcontractoronretry-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|[dto.ContractorOnRetryResponse](#schemadto.contractoronretryresponse)|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
api_key
</aside>

## UserResendInvitation

<a id="opIdUserResendInvitation"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Authorization' => 'API_KEY'
}

result = RestClient.put '/users/{userId}/invitations/resend',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Authorization': 'API_KEY'
}

r = requests.put('/users/{userId}/invitations/resend', params={

}, headers = headers)

print r.json()

```

`PUT /users/{userId}/invitations/resend`

Endpoint to resend a user's invitation

<h3 id="userresendinvitation-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|userId|path|string|true|none|

<h3 id="userresendinvitation-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|204|[No Content](https://tools.ietf.org/html/rfc7231#section-6.3.5)|No content|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
api_key
</aside>

## UserDeleteInvitation

<a id="opIdUserDeleteInvitation"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Authorization' => 'API_KEY'
}

result = RestClient.delete '/users/{userId}/invitations',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Authorization': 'API_KEY'
}

r = requests.delete('/users/{userId}/invitations', params={

}, headers = headers)

print r.json()

```

`DELETE /users/{userId}/invitations`

Endpoint to delete a user's invitation

<h3 id="userdeleteinvitation-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|userId|path|string|true|none|

<h3 id="userdeleteinvitation-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|204|[No Content](https://tools.ietf.org/html/rfc7231#section-6.3.5)|No content|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
api_key
</aside>

## UserCreateUserPasswordReset

<a id="opIdUserCreateUserPasswordReset"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json',
  'Authorization' => 'API_KEY'
}

result = RestClient.post '/users/{userId}/passwordReset',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json',
  'Authorization': 'API_KEY'
}

r = requests.post('/users/{userId}/passwordReset', params={

}, headers = headers)

print r.json()

```

`POST /users/{userId}/passwordReset`

Endpoint to initiate a password reset for a user

creates a temporary password reset token and
sends and email to the user the reset link

<h3 id="usercreateuserpasswordreset-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|userId|path|string|true|none|

> Example responses

> 200 Response

```json
{}
```

<h3 id="usercreateuserpasswordreset-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|Inline|

<h3 id="usercreateuserpasswordreset-responseschema">Response Schema</h3>

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
api_key
</aside>

## UserAddUserDwollaDocument

<a id="opIdUserAddUserDwollaDocument"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Content-Type' => 'multipart/form-data',
  'Accept' => 'application/json',
  'Authorization' => 'API_KEY'
}

result = RestClient.post '/users/{userId}/documents/dwolla',
  params: {
  'type' => 'string'
}, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Content-Type': 'multipart/form-data',
  'Accept': 'application/json',
  'Authorization': 'API_KEY'
}

r = requests.post('/users/{userId}/documents/dwolla', params={
  'type': 'string'
}, headers = headers)

print r.json()

```

`POST /users/{userId}/documents/dwolla`

Upload a user's document to dwolla for validation

> Body parameter

```yaml
filepond: string

```

<h3 id="useradduserdwolladocument-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|userId|path|string|true|none|
|type|query|string|true|none|
|body|body|[UserAddUserDwollaDocument](#schemauseradduserdwolladocument)|false|none|
|» filepond|body|string(binary)|true|none|

> Example responses

> 200 Response

```json
{
  "id": "string",
  "name": "string",
  "type": "string",
  "status": "string",
  "createdOn": "2019-02-09T08:01:37Z",
  "failureReason": "string"
}
```

<h3 id="useradduserdwolladocument-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|[documents.DocumentResponse](#schemadocuments.documentresponse)|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
api_key
</aside>

## UserAddUserDocument

<a id="opIdUserAddUserDocument"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Content-Type' => 'multipart/form-data',
  'Accept' => 'application/json',
  'Authorization' => 'API_KEY'
}

result = RestClient.post '/users/{userId}/documents',
  params: {
  'type' => 'string'
}, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Content-Type': 'multipart/form-data',
  'Accept': 'application/json',
  'Authorization': 'API_KEY'
}

r = requests.post('/users/{userId}/documents', params={
  'type': 'string'
}, headers = headers)

print r.json()

```

`POST /users/{userId}/documents`

Upload a user's document

> Body parameter

```yaml
filepond: string

```

<h3 id="useradduserdocument-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|userId|path|string|true|none|
|type|query|string|true|none|
|body|body|[UserAddUserDwollaDocument](#schemauseradduserdwolladocument)|false|none|
|» filepond|body|string(binary)|true|none|

> Example responses

> 200 Response

```json
{
  "id": "string",
  "name": "string",
  "type": "string",
  "status": "string",
  "createdOn": "2019-02-09T08:01:37Z",
  "failureReason": "string"
}
```

<h3 id="useradduserdocument-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|[documents.DocumentResponse](#schemadocuments.documentresponse)|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
api_key
</aside>

## UserGetUserDocuments

<a id="opIdUserGetUserDocuments"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json',
  'Authorization' => 'API_KEY'
}

result = RestClient.get '/users/{userId}/documents',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json',
  'Authorization': 'API_KEY'
}

r = requests.get('/users/{userId}/documents', params={

}, headers = headers)

print r.json()

```

`GET /users/{userId}/documents`

Get a list of a user's documents

<h3 id="usergetuserdocuments-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|userId|path|string|true|none|
|type|query|string|false|none|
|page|query|number(double)|false|none|
|limit|query|number(double)|false|none|

> Example responses

> 200 Response

```json
{
  "items": [
    {
      "id": "string",
      "name": "string",
      "type": "string",
      "status": "string",
      "createdOn": "2019-02-09T08:01:37Z",
      "failureReason": "string"
    }
  ],
  "pagination": {
    "total": 0,
    "limit": 0,
    "page": 0,
    "pages": 0
  }
}
```

<h3 id="usergetuserdocuments-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|[documents.PaginatedDocumentResponse](#schemadocuments.paginateddocumentresponse)|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
api_key
</aside>

## UserDeleteUserDocument

<a id="opIdUserDeleteUserDocument"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Authorization' => 'API_KEY'
}

result = RestClient.delete '/users/documents/{id}',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Authorization': 'API_KEY'
}

r = requests.delete('/users/documents/{id}', params={

}, headers = headers)

print r.json()

```

`DELETE /users/documents/{id}`

Delete a user's document

<h3 id="userdeleteuserdocument-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id|path|string|true|none|

<h3 id="userdeleteuserdocument-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|204|[No Content](https://tools.ietf.org/html/rfc7231#section-6.3.5)|No content|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
api_key
</aside>

## UserGetDocumentDownloadLink

<a id="opIdUserGetDocumentDownloadLink"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'text/html',
  'Authorization' => 'API_KEY'
}

result = RestClient.get '/users/documents/{id}',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'text/html',
  'Authorization': 'API_KEY'
}

r = requests.get('/users/documents/{id}', params={

}, headers = headers)

print r.json()

```

`GET /users/documents/{id}`

Get a download link for a user's document

<h3 id="usergetdocumentdownloadlink-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id|path|string|true|none|

> Example responses

> 200 Response

<h3 id="usergetdocumentdownloadlink-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|string|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
api_key
</aside>

## UserFundingSourceGetDefaultFundingSource

<a id="opIdUserFundingSourceGetDefaultFundingSource"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json',
  'Authorization' => 'API_KEY'
}

result = RestClient.get '/users/{userId}/fundingSources/default',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json',
  'Authorization': 'API_KEY'
}

r = requests.get('/users/{userId}/fundingSources/default', params={

}, headers = headers)

print r.json()

```

`GET /users/{userId}/fundingSources/default`

Get a user's default funding source

<h3 id="userfundingsourcegetdefaultfundingsource-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|userId|path|string|true|none|

> Example responses

> 200 Response

```json
{
  "id": "string",
  "type": "string",
  "paymentsUri": "string",
  "profileId": "string",
  "isDefault": true,
  "status": "string",
  "name": "string"
}
```

<h3 id="userfundingsourcegetdefaultfundingsource-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|[models.FundingSourceResponse](#schemamodels.fundingsourceresponse)|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
api_key
</aside>

## UserFundingSourceSetDefaultFundingSource

<a id="opIdUserFundingSourceSetDefaultFundingSource"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Authorization' => 'API_KEY'
}

result = RestClient.post '/users/{userId}/fundingSources/{id}/default',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Authorization': 'API_KEY'
}

r = requests.post('/users/{userId}/fundingSources/{id}/default', params={

}, headers = headers)

print r.json()

```

`POST /users/{userId}/fundingSources/{id}/default`

Set a user's default funding source

<h3 id="userfundingsourcesetdefaultfundingsource-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|userId|path|string|true|none|
|id|path|string|true|none|

<h3 id="userfundingsourcesetdefaultfundingsource-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|204|[No Content](https://tools.ietf.org/html/rfc7231#section-6.3.5)|No content|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
api_key
</aside>

## UserFundingSourceCreateFundingSourceFromBankAccount

<a id="opIdUserFundingSourceCreateFundingSourceFromBankAccount"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Content-Type' => 'application/json',
  'Accept' => 'application/json',
  'Authorization' => 'API_KEY'
}

result = RestClient.post '/users/{userId}/fundingSources/',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': 'API_KEY'
}

r = requests.post('/users/{userId}/fundingSources/', params={

}, headers = headers)

print r.json()

```

`POST /users/{userId}/fundingSources/`

Create a user's funding source using a bank account

> Body parameter

```json
{
  "name": "string"
}
```

<h3 id="userfundingsourcecreatefundingsourcefrombankaccount-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|userId|path|string|true|none|
|body|body|[models.FundingSourceRequest](#schemamodels.fundingsourcerequest)|true|none|

> Example responses

> 200 Response

```json
{
  "id": "string",
  "type": "string",
  "paymentsUri": "string",
  "profileId": "string",
  "isDefault": true,
  "status": "string",
  "name": "string"
}
```

<h3 id="userfundingsourcecreatefundingsourcefrombankaccount-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|[models.FundingSourceResponse](#schemamodels.fundingsourceresponse)|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
api_key
</aside>

## UserFundingSourceGetFundingSources

<a id="opIdUserFundingSourceGetFundingSources"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Authorization' => 'API_KEY'
}

result = RestClient.get '/users/{userId}/fundingSources/',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Authorization': 'API_KEY'
}

r = requests.get('/users/{userId}/fundingSources/', params={

}, headers = headers)

print r.json()

```

`GET /users/{userId}/fundingSources/`

Query for a list of a user's funding sources

<h3 id="userfundingsourcegetfundingsources-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|userId|path|string|true|none|
|page|query|number(double)|false|none|
|limit|query|number(double)|false|none|

<h3 id="userfundingsourcegetfundingsources-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|204|[No Content](https://tools.ietf.org/html/rfc7231#section-6.3.5)|No content|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
api_key
</aside>

## UserFundingSourceDeleteFundingSource

<a id="opIdUserFundingSourceDeleteFundingSource"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Authorization' => 'API_KEY'
}

result = RestClient.delete '/users/{userId}/fundingSources/{id}',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Authorization': 'API_KEY'
}

r = requests.delete('/users/{userId}/fundingSources/{id}', params={

}, headers = headers)

print r.json()

```

`DELETE /users/{userId}/fundingSources/{id}`

Delete a user's funding source

<h3 id="userfundingsourcedeletefundingsource-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|userId|path|string|true|none|
|id|path|string|true|none|

<h3 id="userfundingsourcedeletefundingsource-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|204|[No Content](https://tools.ietf.org/html/rfc7231#section-6.3.5)|No content|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
api_key
</aside>

## UserFundingSourceCreateFundingSourceFromIav

<a id="opIdUserFundingSourceCreateFundingSourceFromIav"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Content-Type' => 'application/json',
  'Accept' => 'application/json',
  'Authorization' => 'API_KEY'
}

result = RestClient.post '/users/{userId}/fundingSources/iav',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': 'API_KEY'
}

r = requests.post('/users/{userId}/fundingSources/iav', params={

}, headers = headers)

print r.json()

```

`POST /users/{userId}/fundingSources/iav`

Create a user's funding source using an IAV URI

> Body parameter

```json
{
  "uri": "string"
}
```

<h3 id="userfundingsourcecreatefundingsourcefromiav-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|userId|path|string|true|none|
|body|body|[models.FundingSourceIavRequest](#schemamodels.fundingsourceiavrequest)|true|none|

> Example responses

> 200 Response

```json
{
  "id": "string",
  "type": "string",
  "paymentsUri": "string",
  "profileId": "string",
  "isDefault": true,
  "status": "string",
  "name": "string"
}
```

<h3 id="userfundingsourcecreatefundingsourcefromiav-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|[models.FundingSourceResponse](#schemamodels.fundingsourceresponse)|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
api_key
</aside>

## UserFundingSourceGetIavToken

<a id="opIdUserFundingSourceGetIavToken"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json',
  'Authorization' => 'API_KEY'
}

result = RestClient.get '/users/{userId}/fundingSources/iav',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json',
  'Authorization': 'API_KEY'
}

r = requests.get('/users/{userId}/fundingSources/iav', params={

}, headers = headers)

print r.json()

```

`GET /users/{userId}/fundingSources/iav`

Get an IAV token

<h3 id="userfundingsourcegetiavtoken-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|userId|path|string|true|none|

> Example responses

> 200 Response

```json
{
  "token": "string"
}
```

<h3 id="userfundingsourcegetiavtoken-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|[models.FundingSourceIavToken](#schemamodels.fundingsourceiavtoken)|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
api_key
</aside>

<h1 id="thor-api-monitoring">monitoring</h1>

## MonitoringHealth

<a id="opIdMonitoringHealth"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

result = RestClient.get '/',
  params: {
  }

p JSON.parse(result)

```

```python
import requests

r = requests.get('/', params={

)

print r.json()

```

`GET /`

<h3 id="monitoringhealth-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|204|[No Content](https://tools.ietf.org/html/rfc7231#section-6.3.5)|No content|None|

<aside class="success">
This operation does not require authentication
</aside>

<h1 id="thor-api-tenants">tenants</h1>

## TenantCreateTenant

<a id="opIdTenantCreateTenant"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Content-Type' => 'application/json',
  'Accept' => 'application/json',
  'Authorization' => 'API_KEY'
}

result = RestClient.post '/tenants/',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': 'API_KEY'
}

r = requests.post('/tenants/', params={

}, headers = headers)

print r.json()

```

`POST /tenants/`

Create a new tenant
TODO: require thor

> Body parameter

```json
{
  "name": "string"
}
```

<h3 id="tenantcreatetenant-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[models.TenantRequest](#schemamodels.tenantrequest)|true|none|

> Example responses

> 200 Response

```json
{
  "id": "string",
  "createdAt": "2019-02-09T08:01:37Z",
  "updatedAt": "2019-02-09T08:01:37Z",
  "status": "string",
  "settings": {},
  "name": "string"
}
```

<h3 id="tenantcreatetenant-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|[models.TenantResponse](#schemamodels.tenantresponse)|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
api_key
</aside>

## TenantGetTenant

<a id="opIdTenantGetTenant"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json',
  'Authorization' => 'API_KEY'
}

result = RestClient.get '/tenants/',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json',
  'Authorization': 'API_KEY'
}

r = requests.get('/tenants/', params={

}, headers = headers)

print r.json()

```

`GET /tenants/`

Get the current tenant profile

> Example responses

> 200 Response

```json
{
  "id": "string",
  "createdAt": "2019-02-09T08:01:37Z",
  "updatedAt": "2019-02-09T08:01:37Z",
  "status": "string",
  "settings": {},
  "name": "string"
}
```

<h3 id="tenantgettenant-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|[models.TenantResponse](#schemamodels.tenantresponse)|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
api_key
</aside>

<h1 id="thor-api-tenantcompany">tenantCompany</h1>

## TenantCreateTenantCompany

<a id="opIdTenantCreateTenantCompany"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Content-Type' => 'application/json',
  'Accept' => 'application/json',
  'Authorization' => 'API_KEY'
}

result = RestClient.post '/tenants/company',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': 'API_KEY'
}

r = requests.post('/tenants/company', params={

}, headers = headers)

print r.json()

```

`POST /tenants/company`

Create the current tenant company profile

> Body parameter

```json
{
  "businessName": "string",
  "doingBusinessAs": "string",
  "businessType": "string",
  "businessClassification": "string",
  "address1": "string",
  "address2": "string",
  "city": "string",
  "state": "string",
  "postalCode": "string",
  "phone": "string",
  "ein": "string",
  "website": "string",
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "dateOfBirth": "string",
  "ssn": "string",
  "controller": {
    "firstName": "string",
    "lastName": "string",
    "title": "string",
    "dateOfBirth": "string",
    "ssn": "string",
    "address": {
      "address1": "string",
      "address2": "string",
      "city": "string",
      "stateProvinceRegion": "string",
      "postalCode": "string",
      "country": "string"
    }
  }
}
```

<h3 id="tenantcreatetenantcompany-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[models.TenantCompanyRequest](#schemamodels.tenantcompanyrequest)|true|none|

> Example responses

> 200 Response

```json
{
  "firstName": "string",
  "lastName": "string",
  "phone": "string",
  "email": "string",
  "country": "string",
  "state": "string",
  "city": "string",
  "postalCode": "string",
  "address1": "string",
  "address2": "string",
  "businessName": "string",
  "doingBusinessAs": "string",
  "businessType": "string",
  "businessClassification": "string",
  "website": "string",
  "status": "string"
}
```

<h3 id="tenantcreatetenantcompany-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|[models.TenantCompanyResponse](#schemamodels.tenantcompanyresponse)|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
api_key
</aside>

## TenantGetTenantCompany

<a id="opIdTenantGetTenantCompany"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json',
  'Authorization' => 'API_KEY'
}

result = RestClient.get '/tenants/company',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json',
  'Authorization': 'API_KEY'
}

r = requests.get('/tenants/company', params={

}, headers = headers)

print r.json()

```

`GET /tenants/company`

Get the current tenant company profile

> Example responses

> 200 Response

```json
{
  "firstName": "string",
  "lastName": "string",
  "phone": "string",
  "email": "string",
  "country": "string",
  "state": "string",
  "city": "string",
  "postalCode": "string",
  "address1": "string",
  "address2": "string",
  "businessName": "string",
  "doingBusinessAs": "string",
  "businessType": "string",
  "businessClassification": "string",
  "website": "string",
  "status": "string"
}
```

<h3 id="tenantgettenantcompany-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|[models.TenantCompanyResponse](#schemamodels.tenantcompanyresponse)|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
api_key
</aside>

## TenantUpdateTenantCompany

<a id="opIdTenantUpdateTenantCompany"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Content-Type' => 'application/json',
  'Accept' => 'application/json',
  'Authorization' => 'API_KEY'
}

result = RestClient.patch '/tenants/company',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': 'API_KEY'
}

r = requests.patch('/tenants/company', params={

}, headers = headers)

print r.json()

```

`PATCH /tenants/company`

Update the current tenant company profile

> Body parameter

```json
{
  "phone": "string",
  "email": "string",
  "country": "string",
  "state": "string",
  "city": "string",
  "postalCode": "string",
  "address1": "string",
  "address2": "string",
  "doingBusinessAs": "string",
  "website": "string"
}
```

<h3 id="tenantupdatetenantcompany-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[models.TenantCompanyPatchRequest](#schemamodels.tenantcompanypatchrequest)|true|none|

> Example responses

> 200 Response

```json
{
  "firstName": "string",
  "lastName": "string",
  "phone": "string",
  "email": "string",
  "country": "string",
  "state": "string",
  "city": "string",
  "postalCode": "string",
  "address1": "string",
  "address2": "string",
  "businessName": "string",
  "doingBusinessAs": "string",
  "businessType": "string",
  "businessClassification": "string",
  "website": "string",
  "status": "string"
}
```

<h3 id="tenantupdatetenantcompany-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|[models.TenantCompanyResponse](#schemamodels.tenantcompanyresponse)|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
api_key
</aside>

## TenantRetryTenantCompany

<a id="opIdTenantRetryTenantCompany"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Content-Type' => 'application/json',
  'Accept' => 'application/json',
  'Authorization' => 'API_KEY'
}

result = RestClient.put '/tenants/company',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': 'API_KEY'
}

r = requests.put('/tenants/company', params={

}, headers = headers)

print r.json()

```

`PUT /tenants/company`

Resubmit the current tenant company profile

> Body parameter

```json
{
  "businessName": "string",
  "doingBusinessAs": "string",
  "businessType": "string",
  "businessClassification": "string",
  "address1": "string",
  "address2": "string",
  "city": "string",
  "state": "string",
  "postalCode": "string",
  "phone": "string",
  "ein": "string",
  "website": "string",
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "dateOfBirth": "string",
  "ssn": "string",
  "controller": {
    "firstName": "string",
    "lastName": "string",
    "title": "string",
    "dateOfBirth": "string",
    "ssn": "string",
    "address": {
      "address1": "string",
      "address2": "string",
      "city": "string",
      "stateProvinceRegion": "string",
      "postalCode": "string",
      "country": "string"
    }
  }
}
```

<h3 id="tenantretrytenantcompany-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[models.TenantCompanyRetryRequest](#schemamodels.tenantcompanyretryrequest)|true|none|

> Example responses

> 200 Response

```json
{
  "firstName": "string",
  "lastName": "string",
  "phone": "string",
  "email": "string",
  "country": "string",
  "state": "string",
  "city": "string",
  "postalCode": "string",
  "address1": "string",
  "address2": "string",
  "businessName": "string",
  "doingBusinessAs": "string",
  "businessType": "string",
  "businessClassification": "string",
  "website": "string",
  "status": "string"
}
```

<h3 id="tenantretrytenantcompany-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|[models.TenantCompanyResponse](#schemamodels.tenantcompanyresponse)|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
api_key
</aside>

## TenantGetTenantCompanyOwner

<a id="opIdTenantGetTenantCompanyOwner"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json',
  'Authorization' => 'API_KEY'
}

result = RestClient.get '/tenants/company/owner',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json',
  'Authorization': 'API_KEY'
}

r = requests.get('/tenants/company/owner', params={

}, headers = headers)

print r.json()

```

`GET /tenants/company/owner`

Get the current tenant owner profile

> Example responses

> 200 Response

```json
{
  "firstName": "string",
  "lastName": "string",
  "title": "string",
  "address": {
    "address1": "string",
    "address2": "string",
    "city": "string",
    "stateProvinceRegion": "string",
    "postalCode": "string",
    "country": "string"
  }
}
```

<h3 id="tenantgettenantcompanyowner-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|[models.TenantOwnerResponse](#schemamodels.tenantownerresponse)|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
api_key
</aside>

## TenantGetBusinessCategories

<a id="opIdTenantGetBusinessCategories"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Authorization' => 'API_KEY'
}

result = RestClient.get '/tenants/company/businessCategories',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Authorization': 'API_KEY'
}

r = requests.get('/tenants/company/businessCategories', params={

}, headers = headers)

print r.json()

```

`GET /tenants/company/businessCategories`

Get the list of business classifications for a tenant company

<h3 id="tenantgetbusinesscategories-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|204|[No Content](https://tools.ietf.org/html/rfc7231#section-6.3.5)|No content|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
api_key
</aside>

## BeneficialOwnerAddBeneficialOwner

<a id="opIdBeneficialOwnerAddBeneficialOwner"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Content-Type' => 'application/json',
  'Accept' => 'application/json',
  'Authorization' => 'API_KEY'
}

result = RestClient.post '/tenants/company/beneficialOwners',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': 'API_KEY'
}

r = requests.post('/tenants/company/beneficialOwners', params={

}, headers = headers)

print r.json()

```

`POST /tenants/company/beneficialOwners`

> Body parameter

```json
{
  "dateOfBirth": "string",
  "ssn": "string",
  "firstName": "string",
  "lastName": "string",
  "address": {
    "address1": "string",
    "address2": "string",
    "city": "string",
    "stateProvinceRegion": "string",
    "postalCode": "string",
    "country": "string"
  }
}
```

<h3 id="beneficialowneraddbeneficialowner-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[models.AddBeneficialOwnerRequest](#schemamodels.addbeneficialownerrequest)|true|none|

> Example responses

> 200 Response

```json
{
  "id": "string",
  "verificationStatus": "string",
  "firstName": "string",
  "lastName": "string",
  "address": {
    "address1": "string",
    "address2": "string",
    "city": "string",
    "stateProvinceRegion": "string",
    "postalCode": "string",
    "country": "string"
  }
}
```

<h3 id="beneficialowneraddbeneficialowner-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|[models.BeneficialOwnerResponse](#schemamodels.beneficialownerresponse)|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
api_key
</aside>

## BeneficialOwnerRetryBeneficialOwner

<a id="opIdBeneficialOwnerRetryBeneficialOwner"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Content-Type' => 'application/json',
  'Accept' => 'application/json',
  'Authorization' => 'API_KEY'
}

result = RestClient.put '/tenants/company/beneficialOwners',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': 'API_KEY'
}

r = requests.put('/tenants/company/beneficialOwners', params={

}, headers = headers)

print r.json()

```

`PUT /tenants/company/beneficialOwners`

> Body parameter

```json
{
  "id": "string",
  "dateOfBirth": "string",
  "ssn": "string",
  "firstName": "string",
  "lastName": "string",
  "address": {
    "address1": "string",
    "address2": "string",
    "city": "string",
    "stateProvinceRegion": "string",
    "postalCode": "string",
    "country": "string"
  }
}
```

<h3 id="beneficialownerretrybeneficialowner-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[models.RetryBeneficialOwnerRequest](#schemamodels.retrybeneficialownerrequest)|true|none|

> Example responses

> 200 Response

```json
{}
```

<h3 id="beneficialownerretrybeneficialowner-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|Inline|

<h3 id="beneficialownerretrybeneficialowner-responseschema">Response Schema</h3>

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
api_key
</aside>

## BeneficialOwnerEditBeneficialOwner

<a id="opIdBeneficialOwnerEditBeneficialOwner"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Content-Type' => 'application/json',
  'Accept' => 'application/json',
  'Authorization' => 'API_KEY'
}

result = RestClient.patch '/tenants/company/beneficialOwners',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': 'API_KEY'
}

r = requests.patch('/tenants/company/beneficialOwners', params={

}, headers = headers)

print r.json()

```

`PATCH /tenants/company/beneficialOwners`

> Body parameter

```json
{
  "id": "string",
  "dateOfBirth": "string",
  "ssn": "string",
  "firstName": "string",
  "lastName": "string",
  "address": {
    "address1": "string",
    "address2": "string",
    "city": "string",
    "stateProvinceRegion": "string",
    "postalCode": "string",
    "country": "string"
  }
}
```

<h3 id="beneficialownereditbeneficialowner-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[models.EditBeneficialOwnerRequest](#schemamodels.editbeneficialownerrequest)|true|none|

> Example responses

> 200 Response

```json
{
  "dateOfBirth": "string",
  "ssn": "string",
  "firstName": "string",
  "lastName": "string",
  "address": {
    "address1": "string",
    "address2": "string",
    "city": "string",
    "stateProvinceRegion": "string",
    "postalCode": "string",
    "country": "string"
  }
}
```

<h3 id="beneficialownereditbeneficialowner-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|[models.EditBeneficialOwnerResponse](#schemamodels.editbeneficialownerresponse)|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
api_key
</aside>

## BeneficialOwnerGetBeneficialOwners

<a id="opIdBeneficialOwnerGetBeneficialOwners"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json',
  'Authorization' => 'API_KEY'
}

result = RestClient.get '/tenants/company/beneficialOwners',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json',
  'Authorization': 'API_KEY'
}

r = requests.get('/tenants/company/beneficialOwners', params={

}, headers = headers)

print r.json()

```

`GET /tenants/company/beneficialOwners`

<h3 id="beneficialownergetbeneficialowners-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|page|query|number(double)|false|none|
|limit|query|number(double)|false|none|

> Example responses

> 200 Response

```json
{
  "items": [
    {
      "id": "string",
      "verificationStatus": "string",
      "firstName": "string",
      "lastName": "string",
      "address": {
        "address1": "string",
        "address2": "string",
        "city": "string",
        "stateProvinceRegion": "string",
        "postalCode": "string",
        "country": "string"
      }
    }
  ],
  "pagination": {
    "total": 0,
    "limit": 0,
    "page": 0,
    "pages": 0
  }
}
```

<h3 id="beneficialownergetbeneficialowners-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|[models.PaginatedBeneficialOwnerResponse](#schemamodels.paginatedbeneficialownerresponse)|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
api_key
</aside>

## BeneficialOwnerGetBeneficialOwner

<a id="opIdBeneficialOwnerGetBeneficialOwner"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json',
  'Authorization' => 'API_KEY'
}

result = RestClient.get '/tenants/company/beneficialOwners/{id}',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json',
  'Authorization': 'API_KEY'
}

r = requests.get('/tenants/company/beneficialOwners/{id}', params={

}, headers = headers)

print r.json()

```

`GET /tenants/company/beneficialOwners/{id}`

<h3 id="beneficialownergetbeneficialowner-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id|path|string|true|none|

> Example responses

> 200 Response

```json
{
  "id": "string",
  "verificationStatus": "string",
  "firstName": "string",
  "lastName": "string",
  "address": {
    "address1": "string",
    "address2": "string",
    "city": "string",
    "stateProvinceRegion": "string",
    "postalCode": "string",
    "country": "string"
  }
}
```

<h3 id="beneficialownergetbeneficialowner-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|[models.BeneficialOwnerResponse](#schemamodels.beneficialownerresponse)|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
api_key
</aside>

## BeneficialOwnerDeleteBeneficialOwner

<a id="opIdBeneficialOwnerDeleteBeneficialOwner"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Authorization' => 'API_KEY'
}

result = RestClient.delete '/tenants/company/beneficialOwners/{id}',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Authorization': 'API_KEY'
}

r = requests.delete('/tenants/company/beneficialOwners/{id}', params={

}, headers = headers)

print r.json()

```

`DELETE /tenants/company/beneficialOwners/{id}`

<h3 id="beneficialownerdeletebeneficialowner-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id|path|string|true|none|

<h3 id="beneficialownerdeletebeneficialowner-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|204|[No Content](https://tools.ietf.org/html/rfc7231#section-6.3.5)|No content|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
api_key
</aside>

## TenantFundingSourcesCreateFundingSource

<a id="opIdTenantFundingSourcesCreateFundingSource"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Content-Type' => 'application/json',
  'Accept' => 'application/json',
  'Authorization' => 'API_KEY'
}

result = RestClient.post '/tenants/company/fundingSources/',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': 'API_KEY'
}

r = requests.post('/tenants/company/fundingSources/', params={

}, headers = headers)

print r.json()

```

`POST /tenants/company/fundingSources/`

> Body parameter

```json
{
  "account": "string",
  "routing": "string",
  "bankAccountType": "string",
  "name": "string"
}
```

<h3 id="tenantfundingsourcescreatefundingsource-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[models.CreateTenantFundingSourceRequest](#schemamodels.createtenantfundingsourcerequest)|true|none|

> Example responses

> 200 Response

```json
{
  "name": "string",
  "status": "string"
}
```

<h3 id="tenantfundingsourcescreatefundingsource-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|[models.TenantFundingSourceResponse](#schemamodels.tenantfundingsourceresponse)|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
api_key
</aside>

## TenantFundingSourcesGetFundingSource

<a id="opIdTenantFundingSourcesGetFundingSource"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json',
  'Authorization' => 'API_KEY'
}

result = RestClient.get '/tenants/company/fundingSources/',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json',
  'Authorization': 'API_KEY'
}

r = requests.get('/tenants/company/fundingSources/', params={

}, headers = headers)

print r.json()

```

`GET /tenants/company/fundingSources/`

> Example responses

> 200 Response

```json
{
  "name": "string",
  "status": "string"
}
```

<h3 id="tenantfundingsourcesgetfundingsource-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|[models.TenantFundingSourceResponse](#schemamodels.tenantfundingsourceresponse)|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
api_key
</aside>

## TenantFundingSourcesDeleteFundingSource

<a id="opIdTenantFundingSourcesDeleteFundingSource"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Authorization' => 'API_KEY'
}

result = RestClient.delete '/tenants/company/fundingSources/',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Authorization': 'API_KEY'
}

r = requests.delete('/tenants/company/fundingSources/', params={

}, headers = headers)

print r.json()

```

`DELETE /tenants/company/fundingSources/`

<h3 id="tenantfundingsourcesdeletefundingsource-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|204|[No Content](https://tools.ietf.org/html/rfc7231#section-6.3.5)|No content|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
api_key
</aside>

## TenantFundingSourcesInitiateFundingSourceVerification

<a id="opIdTenantFundingSourcesInitiateFundingSourceVerification"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Authorization' => 'API_KEY'
}

result = RestClient.post '/tenants/company/fundingSources/verify',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Authorization': 'API_KEY'
}

r = requests.post('/tenants/company/fundingSources/verify', params={

}, headers = headers)

print r.json()

```

`POST /tenants/company/fundingSources/verify`

<h3 id="tenantfundingsourcesinitiatefundingsourceverification-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|204|[No Content](https://tools.ietf.org/html/rfc7231#section-6.3.5)|No content|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
api_key
</aside>

## TenantFundingSourcesVerifyFundingSource

<a id="opIdTenantFundingSourcesVerifyFundingSource"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Content-Type' => 'application/json',
  'Authorization' => 'API_KEY'
}

result = RestClient.patch '/tenants/company/fundingSources/verify',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Content-Type': 'application/json',
  'Authorization': 'API_KEY'
}

r = requests.patch('/tenants/company/fundingSources/verify', params={

}, headers = headers)

print r.json()

```

`PATCH /tenants/company/fundingSources/verify`

> Body parameter

```json
{
  "amount1": 0,
  "amount2": 0
}
```

<h3 id="tenantfundingsourcesverifyfundingsource-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[models.TenantFundingSourceVerificationRequest](#schemamodels.tenantfundingsourceverificationrequest)|true|none|

<h3 id="tenantfundingsourcesverifyfundingsource-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|204|[No Content](https://tools.ietf.org/html/rfc7231#section-6.3.5)|No content|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
api_key
</aside>

## TenantFundingSourcesAddVeryfingFundingSource

<a id="opIdTenantFundingSourcesAddVeryfingFundingSource"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Content-Type' => 'application/json',
  'Accept' => 'application/json',
  'Authorization' => 'API_KEY'
}

result = RestClient.post '/tenants/company/fundingSources/iav',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': 'API_KEY'
}

r = requests.post('/tenants/company/fundingSources/iav', params={

}, headers = headers)

print r.json()

```

`POST /tenants/company/fundingSources/iav`

> Body parameter

```json
{
  "uri": "string"
}
```

<h3 id="tenantfundingsourcesaddveryfingfundingsource-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[models.FundingSourceIavRequest](#schemamodels.fundingsourceiavrequest)|true|none|

> Example responses

> 200 Response

```json
{
  "name": "string",
  "status": "string"
}
```

<h3 id="tenantfundingsourcesaddveryfingfundingsource-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|[models.TenantFundingSourceResponse](#schemamodels.tenantfundingsourceresponse)|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
api_key
</aside>

## TenantFundingSourcesGetIavToken

<a id="opIdTenantFundingSourcesGetIavToken"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Authorization' => 'API_KEY'
}

result = RestClient.get '/tenants/company/fundingSources/iav',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Authorization': 'API_KEY'
}

r = requests.get('/tenants/company/fundingSources/iav', params={

}, headers = headers)

print r.json()

```

`GET /tenants/company/fundingSources/iav`

<h3 id="tenantfundingsourcesgetiavtoken-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|204|[No Content](https://tools.ietf.org/html/rfc7231#section-6.3.5)|No content|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
api_key
</aside>

<h1 id="thor-api-profiles">profiles</h1>

## ProfileUpdateProfile

<a id="opIdProfileUpdateProfile"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Content-Type' => 'application/json',
  'Accept' => 'application/json',
  'Authorization' => 'API_KEY'
}

result = RestClient.patch '/profiles/',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': 'API_KEY'
}

r = requests.patch('/profiles/', params={

}, headers = headers)

print r.json()

```

`PATCH /profiles/`

Update my profile

> Body parameter

```json
{
  "ssn": "string",
  "externalId": "string",
  "firstName": "string",
  "lastName": "string",
  "phone": "string",
  "email": "string",
  "country": "string",
  "state": "string",
  "city": "string",
  "postalCode": "string",
  "address1": "string",
  "address2": "string",
  "dateOfBirth": "2019-02-09T08:01:37Z"
}
```

<h3 id="profileupdateprofile-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[ProfileRequest](#schemaprofilerequest)|true|none|

> Example responses

> 200 Response

```json
{
  "id": "string",
  "userId": "string",
  "tenantId": "string",
  "paymentsStatus": "string",
  "paymentsType": "string",
  "status": "string",
  "roles": [
    {
      "name": "string"
    }
  ],
  "createdAt": "2019-02-09T08:01:37Z",
  "updatedAt": "2019-02-09T08:01:37Z",
  "firstName": "string",
  "lastName": "string",
  "phone": "string",
  "email": "string",
  "country": "string",
  "state": "string",
  "city": "string",
  "postalCode": "string",
  "address1": "string",
  "address2": "string",
  "dateOfBirth": "2019-02-09T08:01:37Z"
}
```

<h3 id="profileupdateprofile-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|[ProfileResponse](#schemaprofileresponse)|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
api_key
</aside>

## ProfileGetProfile

<a id="opIdProfileGetProfile"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json',
  'Authorization' => 'API_KEY'
}

result = RestClient.get '/profiles/',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json',
  'Authorization': 'API_KEY'
}

r = requests.get('/profiles/', params={

}, headers = headers)

print r.json()

```

`GET /profiles/`

Get my profile

> Example responses

> 200 Response

```json
{
  "id": "string",
  "userId": "string",
  "tenantId": "string",
  "paymentsStatus": "string",
  "paymentsType": "string",
  "status": "string",
  "roles": [
    {
      "name": "string"
    }
  ],
  "createdAt": "2019-02-09T08:01:37Z",
  "updatedAt": "2019-02-09T08:01:37Z",
  "firstName": "string",
  "lastName": "string",
  "phone": "string",
  "email": "string",
  "country": "string",
  "state": "string",
  "city": "string",
  "postalCode": "string",
  "address1": "string",
  "address2": "string",
  "dateOfBirth": "2019-02-09T08:01:37Z"
}
```

<h3 id="profilegetprofile-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|[ProfileResponse](#schemaprofileresponse)|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
api_key
</aside>

<h1 id="thor-api-transactions">transactions</h1>

## TransactionGetTransaction

<a id="opIdTransactionGetTransaction"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json',
  'Authorization' => 'API_KEY'
}

result = RestClient.get '/transactions/{id}',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json',
  'Authorization': 'API_KEY'
}

r = requests.get('/transactions/{id}', params={

}, headers = headers)

print r.json()

```

`GET /transactions/{id}`

<h3 id="transactiongettransaction-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id|path|string|true|none|

> Example responses

> 200 Response

```json
{
  "id": "string",
  "status": "string",
  "createdAt": "2019-02-09T08:01:37Z",
  "updatedAt": "2019-02-09T08:01:37Z",
  "job": {
    "id": "string",
    "createdAt": "2019-02-09T08:01:37Z",
    "updatedAt": "2019-02-09T08:01:37Z",
    "isActive": true,
    "value": 0,
    "name": "string",
    "description": "string",
    "isCustom": true
  },
  "value": 0,
  "userId": "string"
}
```

<h3 id="transactiongettransaction-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|[models.TransactionResponse](#schemamodels.transactionresponse)|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
api_key
</aside>

## TransactionUpdateTransaction

<a id="opIdTransactionUpdateTransaction"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Content-Type' => 'application/json',
  'Accept' => 'application/json',
  'Authorization' => 'API_KEY'
}

result = RestClient.patch '/transactions/{id}',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': 'API_KEY'
}

r = requests.patch('/transactions/{id}', params={

}, headers = headers)

print r.json()

```

`PATCH /transactions/{id}`

> Body parameter

```json
{
  "jobId": "string",
  "value": 0
}
```

<h3 id="transactionupdatetransaction-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id|path|string|true|none|
|body|body|[models.TransactionPatchRequest](#schemamodels.transactionpatchrequest)|true|none|

> Example responses

> 200 Response

```json
{
  "id": "string",
  "status": "string",
  "createdAt": "2019-02-09T08:01:37Z",
  "updatedAt": "2019-02-09T08:01:37Z",
  "job": {
    "id": "string",
    "createdAt": "2019-02-09T08:01:37Z",
    "updatedAt": "2019-02-09T08:01:37Z",
    "isActive": true,
    "value": 0,
    "name": "string",
    "description": "string",
    "isCustom": true
  },
  "value": 0,
  "userId": "string"
}
```

<h3 id="transactionupdatetransaction-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|[models.TransactionResponse](#schemamodels.transactionresponse)|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
api_key
</aside>

## TransactionDeleteTransaction

<a id="opIdTransactionDeleteTransaction"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Authorization' => 'API_KEY'
}

result = RestClient.delete '/transactions/{id}',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Authorization': 'API_KEY'
}

r = requests.delete('/transactions/{id}', params={

}, headers = headers)

print r.json()

```

`DELETE /transactions/{id}`

<h3 id="transactiondeletetransaction-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id|path|string|true|none|

<h3 id="transactiondeletetransaction-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|204|[No Content](https://tools.ietf.org/html/rfc7231#section-6.3.5)|No content|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
api_key
</aside>

## TransactionGetTransactions

<a id="opIdTransactionGetTransactions"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json',
  'Authorization' => 'API_KEY'
}

result = RestClient.get '/transactions/',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json',
  'Authorization': 'API_KEY'
}

r = requests.get('/transactions/', params={

}, headers = headers)

print r.json()

```

`GET /transactions/`

Transactions can be filtered by createdAt date, both dateFrom and dateTill needs to be provided

<h3 id="transactiongettransactions-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|page|query|number(double)|false|page to be queried, starting from 0|
|limit|query|number(double)|false|transactions per page|
|dateFrom|query|string(date-time)|false|starting Date() of transactions e.g. 2018-08-22T14:44:27.727Z|
|dateTill|query|string(date-time)|false|end Date() of transactions, e.g. 2018-08-22T14:44:27.727Z|
|userId|query|string|false|users id as uuidv4 string|
|status|query|string|false|transaction status|

> Example responses

> 200 Response

```json
{
  "items": [
    {
      "id": "string",
      "status": "string",
      "createdAt": "2019-02-09T08:01:37Z",
      "updatedAt": "2019-02-09T08:01:37Z",
      "job": {
        "id": "string",
        "createdAt": "2019-02-09T08:01:37Z",
        "updatedAt": "2019-02-09T08:01:37Z",
        "isActive": true,
        "value": 0,
        "name": "string",
        "description": "string",
        "isCustom": true
      },
      "value": 0,
      "userId": "string"
    }
  ],
  "pagination": {
    "total": 0,
    "limit": 0,
    "page": 0,
    "pages": 0
  }
}
```

<h3 id="transactiongettransactions-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|[models.PaginatedTransactionResponse](#schemamodels.paginatedtransactionresponse)|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
api_key
</aside>

## TransactionCreateTransactionWithExistingJob

<a id="opIdTransactionCreateTransactionWithExistingJob"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Content-Type' => 'application/json',
  'Accept' => 'application/json',
  'Authorization' => 'API_KEY'
}

result = RestClient.post '/transactions/',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': 'API_KEY'
}

r = requests.post('/transactions/', params={

}, headers = headers)

print r.json()

```

`POST /transactions/`

> Body parameter

```json
{
  "jobId": "string",
  "externalId": "string",
  "userId": "string",
  "value": 0
}
```

<h3 id="transactioncreatetransactionwithexistingjob-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[models.TransactionExistingJobRequest](#schemamodels.transactionexistingjobrequest)|true|none|

> Example responses

> 200 Response

```json
{
  "id": "string",
  "status": "string",
  "createdAt": "2019-02-09T08:01:37Z",
  "updatedAt": "2019-02-09T08:01:37Z",
  "job": {
    "id": "string",
    "createdAt": "2019-02-09T08:01:37Z",
    "updatedAt": "2019-02-09T08:01:37Z",
    "isActive": true,
    "value": 0,
    "name": "string",
    "description": "string",
    "isCustom": true
  },
  "value": 0,
  "userId": "string"
}
```

<h3 id="transactioncreatetransactionwithexistingjob-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|[models.TransactionResponse](#schemamodels.transactionresponse)|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
api_key
</aside>

## TransactionCreateTransactionWithCustomJob

<a id="opIdTransactionCreateTransactionWithCustomJob"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Content-Type' => 'application/json',
  'Accept' => 'application/json',
  'Authorization' => 'API_KEY'
}

result = RestClient.post '/transactions/custom',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': 'API_KEY'
}

r = requests.post('/transactions/custom', params={

}, headers = headers)

print r.json()

```

`POST /transactions/custom`

> Body parameter

```json
{
  "job": {
    "value": 0,
    "name": "string",
    "description": "string",
    "isCustom": true
  },
  "externalId": "string",
  "userId": "string",
  "value": 0
}
```

<h3 id="transactioncreatetransactionwithcustomjob-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[models.TransactionCustomJobRequest](#schemamodels.transactioncustomjobrequest)|true|none|

> Example responses

> 200 Response

```json
{
  "id": "string",
  "status": "string",
  "createdAt": "2019-02-09T08:01:37Z",
  "updatedAt": "2019-02-09T08:01:37Z",
  "job": {
    "id": "string",
    "createdAt": "2019-02-09T08:01:37Z",
    "updatedAt": "2019-02-09T08:01:37Z",
    "isActive": true,
    "value": 0,
    "name": "string",
    "description": "string",
    "isCustom": true
  },
  "value": 0,
  "userId": "string"
}
```

<h3 id="transactioncreatetransactionwithcustomjob-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|[models.TransactionResponse](#schemamodels.transactionresponse)|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
api_key
</aside>

## TransactionCreateTransactionTransfer

<a id="opIdTransactionCreateTransactionTransfer"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json',
  'Authorization' => 'API_KEY'
}

result = RestClient.post '/transactions/{id}/transfers',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json',
  'Authorization': 'API_KEY'
}

r = requests.post('/transactions/{id}/transfers', params={

}, headers = headers)

print r.json()

```

`POST /transactions/{id}/transfers`

<h3 id="transactioncreatetransactiontransfer-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id|path|string|true|none|

> Example responses

> 200 Response

```json
{
  "id": "string",
  "status": "string",
  "createdAt": "2019-02-09T08:01:37Z",
  "updatedAt": "2019-02-09T08:01:37Z",
  "job": {
    "id": "string",
    "createdAt": "2019-02-09T08:01:37Z",
    "updatedAt": "2019-02-09T08:01:37Z",
    "isActive": true,
    "value": 0,
    "name": "string",
    "description": "string",
    "isCustom": true
  },
  "value": 0,
  "userId": "string"
}
```

<h3 id="transactioncreatetransactiontransfer-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|[models.TransactionResponse](#schemamodels.transactionresponse)|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
api_key
</aside>

## TransactionCancelTransactionTransfer

<a id="opIdTransactionCancelTransactionTransfer"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json',
  'Authorization' => 'API_KEY'
}

result = RestClient.delete '/transactions/{id}/transfers',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json',
  'Authorization': 'API_KEY'
}

r = requests.delete('/transactions/{id}/transfers', params={

}, headers = headers)

print r.json()

```

`DELETE /transactions/{id}/transfers`

<h3 id="transactioncanceltransactiontransfer-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id|path|string|true|none|

> Example responses

> 200 Response

```json
{
  "id": "string",
  "status": "string",
  "createdAt": "2019-02-09T08:01:37Z",
  "updatedAt": "2019-02-09T08:01:37Z",
  "job": {
    "id": "string",
    "createdAt": "2019-02-09T08:01:37Z",
    "updatedAt": "2019-02-09T08:01:37Z",
    "isActive": true,
    "value": 0,
    "name": "string",
    "description": "string",
    "isCustom": true
  },
  "value": 0,
  "userId": "string"
}
```

<h3 id="transactioncanceltransactiontransfer-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|[models.TransactionResponse](#schemamodels.transactionresponse)|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
api_key
</aside>

## TransactionCreateTransactionsTransfer

<a id="opIdTransactionCreateTransactionsTransfer"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Content-Type' => 'application/json',
  'Accept' => 'application/json',
  'Authorization' => 'API_KEY'
}

result = RestClient.post '/transactions/transfers',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': 'API_KEY'
}

r = requests.post('/transactions/transfers', params={

}, headers = headers)

print r.json()

```

`POST /transactions/transfers`

> Body parameter

```json
{
  "transactionsIds": [
    "string"
  ]
}
```

<h3 id="transactioncreatetransactionstransfer-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[models.TransactionsTransferRequest](#schemamodels.transactionstransferrequest)|true|none|

> Example responses

> 200 Response

```json
{
  "id": "string",
  "adminId": "string",
  "status": "string",
  "createdAt": "2019-02-09T08:01:37Z",
  "updatedAt": "2019-02-09T08:01:37Z",
  "value": 0
}
```

<h3 id="transactioncreatetransactionstransfer-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|[models.TransferResponse](#schemamodels.transferresponse)|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
api_key
</aside>

## TransactionGetPeriodStats

<a id="opIdTransactionGetPeriodStats"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json',
  'Authorization' => 'API_KEY'
}

result = RestClient.get '/transactions/rating/period',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json',
  'Authorization': 'API_KEY'
}

r = requests.get('/transactions/rating/period', params={

}, headers = headers)

print r.json()

```

`GET /transactions/rating/period`

<h3 id="transactiongetperiodstats-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|startDate|query|string|false|startDate|
|endDate|query|string|false|endDate|
|limit|query|number(double)|false|transactions per page|
|page|query|number(double)|false|page to be queried, starting from 0|
|status|query|string|false|status|

> Example responses

> 200 Response

```json
{
  "previous": {
    "users": 0,
    "total": 0,
    "startDate": "2019-02-09T08:01:37Z",
    "endDate": "2019-02-09T08:01:37Z"
  },
  "current": {
    "users": 0,
    "total": 0,
    "startDate": "2019-02-09T08:01:37Z",
    "endDate": "2019-02-09T08:01:37Z"
  }
}
```

<h3 id="transactiongetperiodstats-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|[models.PeriodsStatsResponse](#schemamodels.periodsstatsresponse)|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
api_key
</aside>

<h1 id="thor-api-jobs">jobs</h1>

## JobCreate

<a id="opIdJobCreate"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Content-Type' => 'application/json',
  'Accept' => 'application/json',
  'Authorization' => 'API_KEY'
}

result = RestClient.post '/jobs/',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': 'API_KEY'
}

r = requests.post('/jobs/', params={

}, headers = headers)

print r.json()

```

`POST /jobs/`

Create a job

> Body parameter

```json
{
  "value": 0,
  "name": "string",
  "description": "string",
  "isCustom": true
}
```

<h3 id="jobcreate-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[models.JobRequest](#schemamodels.jobrequest)|true|none|

> Example responses

> 200 Response

```json
{
  "id": "string",
  "createdAt": "2019-02-09T08:01:37Z",
  "updatedAt": "2019-02-09T08:01:37Z",
  "isActive": true,
  "value": 0,
  "name": "string",
  "description": "string",
  "isCustom": true
}
```

<h3 id="jobcreate-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|[models.JobResponse](#schemamodels.jobresponse)|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
api_key
</aside>

## JobGetJobs

<a id="opIdJobGetJobs"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json',
  'Authorization' => 'API_KEY'
}

result = RestClient.get '/jobs/',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json',
  'Authorization': 'API_KEY'
}

r = requests.get('/jobs/', params={

}, headers = headers)

print r.json()

```

`GET /jobs/`

Query for a list of jobs

<h3 id="jobgetjobs-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|page|query|number(double)|false|page to be queried, starting from 0|
|limit|query|number(double)|false|transactions per page|
|isActive|query|boolean|false|none|
|isCustom|query|boolean|false|none|
|name|query|string|false|none|
|orderBy|query|string|false|none|
|order|query|string|false|none|

> Example responses

> 200 Response

```json
{
  "items": [
    {
      "id": "string",
      "createdAt": "2019-02-09T08:01:37Z",
      "updatedAt": "2019-02-09T08:01:37Z",
      "isActive": true,
      "value": 0,
      "name": "string",
      "description": "string",
      "isCustom": true
    }
  ],
  "pagination": {
    "total": 0,
    "limit": 0,
    "page": 0,
    "pages": 0
  }
}
```

<h3 id="jobgetjobs-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|[models.PaginatedJobResponse](#schemamodels.paginatedjobresponse)|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
api_key
</aside>

## JobGetJob

<a id="opIdJobGetJob"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json',
  'Authorization' => 'API_KEY'
}

result = RestClient.get '/jobs/{id}',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json',
  'Authorization': 'API_KEY'
}

r = requests.get('/jobs/{id}', params={

}, headers = headers)

print r.json()

```

`GET /jobs/{id}`

Get a job

<h3 id="jobgetjob-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id|path|string|true|none|

> Example responses

> 200 Response

```json
{
  "items": [
    {
      "id": "string",
      "createdAt": "2019-02-09T08:01:37Z",
      "updatedAt": "2019-02-09T08:01:37Z",
      "isActive": true,
      "value": 0,
      "name": "string",
      "description": "string",
      "isCustom": true
    }
  ],
  "pagination": {
    "total": 0,
    "limit": 0,
    "page": 0,
    "pages": 0
  }
}
```

<h3 id="jobgetjob-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|[models.PaginatedJobResponse](#schemamodels.paginatedjobresponse)|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
api_key
</aside>

## JobUpdate

<a id="opIdJobUpdate"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Content-Type' => 'application/json',
  'Accept' => 'application/json',
  'Authorization' => 'API_KEY'
}

result = RestClient.patch '/jobs/{id}',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': 'API_KEY'
}

r = requests.patch('/jobs/{id}', params={

}, headers = headers)

print r.json()

```

`PATCH /jobs/{id}`

Update a job

> Body parameter

```json
{
  "isActive": true,
  "value": 0,
  "name": "string",
  "description": "string",
  "isCustom": true
}
```

<h3 id="jobupdate-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id|path|string|true|none|
|body|body|[models.JobPatchRequest](#schemamodels.jobpatchrequest)|true|none|

> Example responses

> 200 Response

```json
{
  "id": "string",
  "createdAt": "2019-02-09T08:01:37Z",
  "updatedAt": "2019-02-09T08:01:37Z",
  "isActive": true,
  "value": 0,
  "name": "string",
  "description": "string",
  "isCustom": true
}
```

<h3 id="jobupdate-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|[models.JobResponse](#schemamodels.jobresponse)|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
api_key
</aside>

## JobDelete

<a id="opIdJobDelete"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Authorization' => 'API_KEY'
}

result = RestClient.delete '/jobs/{id}',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Authorization': 'API_KEY'
}

r = requests.delete('/jobs/{id}', params={

}, headers = headers)

print r.json()

```

`DELETE /jobs/{id}`

Delete a job

<h3 id="jobdelete-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id|path|string|true|none|

<h3 id="jobdelete-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|204|[No Content](https://tools.ietf.org/html/rfc7231#section-6.3.5)|No content|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
api_key
</aside>

<h1 id="thor-api-dwolla">dwolla</h1>

## DwollaEvents

<a id="opIdDwollaEvents"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Content-Type' => 'application/json'
}

result = RestClient.post '/dwolla/events/',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Content-Type': 'application/json'
}

r = requests.post('/dwolla/events/', params={

}, headers = headers)

print r.json()

```

`POST /dwolla/events/`

> Body parameter

```json
{
  "_links": {},
  "id": "string",
  "topic": "string",
  "resourceId": "string",
  "created": "string"
}
```

<h3 id="dwollaevents-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[IEvent](#schemaievent)|true|none|

<h3 id="dwollaevents-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|204|[No Content](https://tools.ietf.org/html/rfc7231#section-6.3.5)|No content|None|

<aside class="success">
This operation does not require authentication
</aside>

<h1 id="thor-api-invitations">invitations</h1>

## InvitationGetInvitations

<a id="opIdInvitationGetInvitations"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json',
  'Authorization' => 'API_KEY'
}

result = RestClient.get '/invitations/',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json',
  'Authorization': 'API_KEY'
}

r = requests.get('/invitations/', params={

}, headers = headers)

print r.json()

```

`GET /invitations/`

Query for a list of invitations

<h3 id="invitationgetinvitations-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|page|query|number(double)|false|optional: default 1|
|limit|query|number(double)|false|optional: default 1|
|status|query|string|false|optional: [new, used]|
|type|query|string|false|optional: [contractor, admin]|

> Example responses

> 200 Response

```json
{
  "items": [
    {
      "id": "string",
      "status": "string",
      "createdAt": "2019-02-09T08:01:37Z",
      "updatedAt": "2019-02-09T08:01:37Z",
      "email": "string"
    }
  ],
  "pagination": {
    "total": 0,
    "limit": 0,
    "page": 0,
    "pages": 0
  }
}
```

<h3 id="invitationgetinvitations-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|[models.InvitationPaginatedResponse](#schemamodels.invitationpaginatedresponse)|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
api_key
</aside>

## InvitationCreateInvitation

<a id="opIdInvitationCreateInvitation"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Content-Type' => 'application/json',
  'Accept' => 'application/json',
  'Authorization' => 'API_KEY'
}

result = RestClient.post '/invitations/',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': 'API_KEY'
}

r = requests.post('/invitations/', params={

}, headers = headers)

print r.json()

```

`POST /invitations/`

Create an invitation

> Body parameter

```json
{
  "type": "string",
  "role": "string",
  "email": "string"
}
```

<h3 id="invitationcreateinvitation-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[models.InvitationRequest](#schemamodels.invitationrequest)|true|none|

> Example responses

> 200 Response

```json
{
  "id": "string",
  "status": "string",
  "createdAt": "2019-02-09T08:01:37Z",
  "updatedAt": "2019-02-09T08:01:37Z",
  "email": "string"
}
```

<h3 id="invitationcreateinvitation-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|[models.InvitationResponse](#schemamodels.invitationresponse)|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
api_key
</aside>

## InvitationDeleteUserInvitation

<a id="opIdInvitationDeleteUserInvitation"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Content-Type' => 'application/json',
  'Authorization' => 'API_KEY'
}

result = RestClient.delete '/invitations/',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Content-Type': 'application/json',
  'Authorization': 'API_KEY'
}

r = requests.delete('/invitations/', params={

}, headers = headers)

print r.json()

```

`DELETE /invitations/`

Delete a user's invitation

> Body parameter

```json
{
  "userId": "string"
}
```

<h3 id="invitationdeleteuserinvitation-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[models.UserInvitationRequest](#schemamodels.userinvitationrequest)|true|none|

<h3 id="invitationdeleteuserinvitation-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|204|[No Content](https://tools.ietf.org/html/rfc7231#section-6.3.5)|No content|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
api_key
</aside>

## InvitationResendUserInvitation

<a id="opIdInvitationResendUserInvitation"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Content-Type' => 'application/json',
  'Authorization' => 'API_KEY'
}

result = RestClient.patch '/invitations/resend',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Content-Type': 'application/json',
  'Authorization': 'API_KEY'
}

r = requests.patch('/invitations/resend', params={

}, headers = headers)

print r.json()

```

`PATCH /invitations/resend`

Resend a user's invitation

> Body parameter

```json
{
  "userId": "string"
}
```

<h3 id="invitationresenduserinvitation-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[models.UserInvitationRequest](#schemamodels.userinvitationrequest)|true|none|

<h3 id="invitationresenduserinvitation-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|204|[No Content](https://tools.ietf.org/html/rfc7231#section-6.3.5)|No content|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
api_key
</aside>

## InvitationResendInvitation

<a id="opIdInvitationResendInvitation"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Authorization' => 'API_KEY'
}

result = RestClient.patch '/invitations/{id}/resend',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Authorization': 'API_KEY'
}

r = requests.patch('/invitations/{id}/resend', params={

}, headers = headers)

print r.json()

```

`PATCH /invitations/{id}/resend`

Resend an invitation

<h3 id="invitationresendinvitation-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id|path|string|true|none|

<h3 id="invitationresendinvitation-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|204|[No Content](https://tools.ietf.org/html/rfc7231#section-6.3.5)|No content|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
api_key
</aside>

## InvitationDeleteInvitation

<a id="opIdInvitationDeleteInvitation"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Authorization' => 'API_KEY'
}

result = RestClient.delete '/invitations/{id}',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Authorization': 'API_KEY'
}

r = requests.delete('/invitations/{id}', params={

}, headers = headers)

print r.json()

```

`DELETE /invitations/{id}`

Delete an invitation

<h3 id="invitationdeleteinvitation-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id|path|string|true|none|

<h3 id="invitationdeleteinvitation-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|204|[No Content](https://tools.ietf.org/html/rfc7231#section-6.3.5)|No content|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
api_key
</aside>

## InvitationCheckGetInvitation

<a id="opIdInvitationCheckGetInvitation"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get '/public/invitations/{id}',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('/public/invitations/{id}', params={

}, headers = headers)

print r.json()

```

`GET /public/invitations/{id}`

<h3 id="invitationcheckgetinvitation-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id|path|string|true|none|

> Example responses

> 200 Response

```json
{
  "id": "string",
  "status": "string",
  "createdAt": "2019-02-09T08:01:37Z",
  "updatedAt": "2019-02-09T08:01:37Z",
  "email": "string"
}
```

<h3 id="invitationcheckgetinvitation-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|[models.InvitationResponse](#schemamodels.invitationresponse)|

<aside class="success">
This operation does not require authentication
</aside>

## InvitationCheckUseInvitationToken

<a id="opIdInvitationCheckUseInvitationToken"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

result = RestClient.put '/public/invitations/{id}',
  params: {
  }

p JSON.parse(result)

```

```python
import requests

r = requests.put('/public/invitations/{id}', params={

)

print r.json()

```

`PUT /public/invitations/{id}`

<h3 id="invitationcheckuseinvitationtoken-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id|path|string|true|none|

<h3 id="invitationcheckuseinvitationtoken-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|204|[No Content](https://tools.ietf.org/html/rfc7231#section-6.3.5)|No content|None|

<aside class="success">
This operation does not require authentication
</aside>

<h1 id="thor-api-contractors">contractors</h1>

## ContractorCreateContractor

<a id="opIdContractorCreateContractor"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Content-Type' => 'application/json',
  'Accept' => 'application/json',
  'Authorization' => 'API_KEY'
}

result = RestClient.post '/contractors/',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': 'API_KEY'
}

r = requests.post('/contractors/', params={

}, headers = headers)

print r.json()

```

`POST /contractors/`

Initialize a contractor's profile and create their payments account

> Body parameter

```json
{
  "profile": {
    "ssn": "string",
    "externalId": "string",
    "firstName": "string",
    "lastName": "string",
    "phone": "string",
    "email": "string",
    "country": "string",
    "state": "string",
    "city": "string",
    "postalCode": "string",
    "address1": "string",
    "address2": "string",
    "dateOfBirth": "2019-02-09T08:01:37Z"
  }
}
```

<h3 id="contractorcreatecontractor-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[ContractorRequest](#schemacontractorrequest)|true|none|

> Example responses

> 200 Response

```json
{
  "id": "string",
  "createdAt": "2019-02-09T08:01:37Z",
  "updatedAt": "2019-02-09T08:01:37Z",
  "lastActivity": "2019-02-09T08:01:37Z",
  "tenantProfile": {
    "id": "string",
    "userId": "string",
    "tenantId": "string",
    "paymentsStatus": "string",
    "paymentsType": "string",
    "status": "string",
    "roles": [
      {
        "name": "string"
      }
    ],
    "createdAt": "2019-02-09T08:01:37Z",
    "updatedAt": "2019-02-09T08:01:37Z",
    "firstName": "string",
    "lastName": "string",
    "phone": "string",
    "email": "string",
    "country": "string",
    "state": "string",
    "city": "string",
    "postalCode": "string",
    "address1": "string",
    "address2": "string",
    "dateOfBirth": "2019-02-09T08:01:37Z"
  }
}
```

<h3 id="contractorcreatecontractor-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|[ContractorResponse](#schemacontractorresponse)|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
api_key
</aside>

## ContractorGetTransactions

<a id="opIdContractorGetTransactions"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json',
  'Authorization' => 'API_KEY'
}

result = RestClient.get '/contractors/transactions',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json',
  'Authorization': 'API_KEY'
}

r = requests.get('/contractors/transactions', params={

}, headers = headers)

print r.json()

```

`GET /contractors/transactions`

Get a list of the contractor's transactions

<h3 id="contractorgettransactions-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|page|query|number(double)|false|none|
|limit|query|number(double)|false|none|
|startDate|query|string(date-time)|false|none|
|endDate|query|string(date-time)|false|none|
|status|query|string|false|none|

> Example responses

> 200 Response

```json
{
  "items": [
    {
      "id": "string",
      "status": "string",
      "createdAt": "2019-02-09T08:01:37Z",
      "updatedAt": "2019-02-09T08:01:37Z",
      "job": {
        "id": "string",
        "createdAt": "2019-02-09T08:01:37Z",
        "updatedAt": "2019-02-09T08:01:37Z",
        "isActive": true,
        "value": 0,
        "name": "string",
        "description": "string",
        "isCustom": true
      },
      "value": 0,
      "userId": "string"
    }
  ],
  "pagination": {
    "total": 0,
    "limit": 0,
    "page": 0,
    "pages": 0
  }
}
```

<h3 id="contractorgettransactions-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|[transactions.PaginatedTransactionResponse](#schematransactions.paginatedtransactionresponse)|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
api_key
</aside>

## ContractorFundingSourceGetFundingSources

<a id="opIdContractorFundingSourceGetFundingSources"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Authorization' => 'API_KEY'
}

result = RestClient.get '/contractors/fundingSources/',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Authorization': 'API_KEY'
}

r = requests.get('/contractors/fundingSources/', params={

}, headers = headers)

print r.json()

```

`GET /contractors/fundingSources/`

Get your funding sources

<h3 id="contractorfundingsourcegetfundingsources-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|page|query|number(double)|false|none|
|limit|query|number(double)|false|none|

<h3 id="contractorfundingsourcegetfundingsources-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|204|[No Content](https://tools.ietf.org/html/rfc7231#section-6.3.5)|No content|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
api_key
</aside>

## ContractorFundingSourceGetDefaultFundingSource

<a id="opIdContractorFundingSourceGetDefaultFundingSource"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Authorization' => 'API_KEY'
}

result = RestClient.get '/contractors/fundingSources/default',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Authorization': 'API_KEY'
}

r = requests.get('/contractors/fundingSources/default', params={

}, headers = headers)

print r.json()

```

`GET /contractors/fundingSources/default`

Get your defualt funding source

<h3 id="contractorfundingsourcegetdefaultfundingsource-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|204|[No Content](https://tools.ietf.org/html/rfc7231#section-6.3.5)|No content|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
api_key
</aside>

## ContractorFundingSourceSetDefaultFundingSource

<a id="opIdContractorFundingSourceSetDefaultFundingSource"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Authorization' => 'API_KEY'
}

result = RestClient.post '/contractors/fundingSources/{id}/default',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Authorization': 'API_KEY'
}

r = requests.post('/contractors/fundingSources/{id}/default', params={

}, headers = headers)

print r.json()

```

`POST /contractors/fundingSources/{id}/default`

Set your default funding source

<h3 id="contractorfundingsourcesetdefaultfundingsource-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id|path|string|true|none|

<h3 id="contractorfundingsourcesetdefaultfundingsource-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|204|[No Content](https://tools.ietf.org/html/rfc7231#section-6.3.5)|No content|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
api_key
</aside>

## ContractorFundingSourceDeleteFundingSource

<a id="opIdContractorFundingSourceDeleteFundingSource"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Authorization' => 'API_KEY'
}

result = RestClient.delete '/contractors/fundingSources/{id}',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Authorization': 'API_KEY'
}

r = requests.delete('/contractors/fundingSources/{id}', params={

}, headers = headers)

print r.json()

```

`DELETE /contractors/fundingSources/{id}`

Delete your funding source

<h3 id="contractorfundingsourcedeletefundingsource-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id|path|string|true|none|

<h3 id="contractorfundingsourcedeletefundingsource-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|204|[No Content](https://tools.ietf.org/html/rfc7231#section-6.3.5)|No content|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
api_key
</aside>

## ContractorFundingSourceCreateFundingSourceFromIav

<a id="opIdContractorFundingSourceCreateFundingSourceFromIav"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Content-Type' => 'application/json',
  'Accept' => 'application/json',
  'Authorization' => 'API_KEY'
}

result = RestClient.post '/contractors/fundingSources/iav',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': 'API_KEY'
}

r = requests.post('/contractors/fundingSources/iav', params={

}, headers = headers)

print r.json()

```

`POST /contractors/fundingSources/iav`

Create your funding source using an IAV URI

> Body parameter

```json
{
  "uri": "string"
}
```

<h3 id="contractorfundingsourcecreatefundingsourcefromiav-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[models.FundingSourceIavRequest](#schemamodels.fundingsourceiavrequest)|true|none|

> Example responses

> 200 Response

```json
{
  "id": "string",
  "type": "string",
  "paymentsUri": "string",
  "profileId": "string",
  "isDefault": true,
  "status": "string",
  "name": "string"
}
```

<h3 id="contractorfundingsourcecreatefundingsourcefromiav-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|[models.FundingSourceResponse](#schemamodels.fundingsourceresponse)|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
api_key
</aside>

## ContractorFundingSourceGetIavToken

<a id="opIdContractorFundingSourceGetIavToken"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json',
  'Authorization' => 'API_KEY'
}

result = RestClient.get '/contractors/fundingSources/iav',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json',
  'Authorization': 'API_KEY'
}

r = requests.get('/contractors/fundingSources/iav', params={

}, headers = headers)

print r.json()

```

`GET /contractors/fundingSources/iav`

Get an IAV token

> Example responses

> 200 Response

```json
{
  "token": "string"
}
```

<h3 id="contractorfundingsourcegetiavtoken-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|[models.FundingSourceIavToken](#schemamodels.fundingsourceiavtoken)|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
api_key
</aside>

<h1 id="thor-api-documents">documents</h1>

## DocumentsAddDwollaDocument

<a id="opIdDocumentsAddDwollaDocument"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Content-Type' => 'multipart/form-data',
  'Accept' => 'application/json',
  'Authorization' => 'API_KEY'
}

result = RestClient.post '/documents/dwolla',
  params: {
  'type' => 'string'
}, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Content-Type': 'multipart/form-data',
  'Accept': 'application/json',
  'Authorization': 'API_KEY'
}

r = requests.post('/documents/dwolla', params={
  'type': 'string'
}, headers = headers)

print r.json()

```

`POST /documents/dwolla`

Upload your document to dwolla for validation

> Body parameter

```yaml
filepond: string

```

<h3 id="documentsadddwolladocument-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|type|query|string|true|none|
|body|body|[UserAddUserDwollaDocument](#schemauseradduserdwolladocument)|false|none|
|» filepond|body|string(binary)|true|none|

> Example responses

> 200 Response

```json
{
  "id": "string",
  "name": "string",
  "type": "string",
  "status": "string",
  "createdOn": "2019-02-09T08:01:37Z",
  "failureReason": "string"
}
```

<h3 id="documentsadddwolladocument-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|[DocumentResponse](#schemadocumentresponse)|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
api_key
</aside>

## DocumentsAddDocument

<a id="opIdDocumentsAddDocument"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Content-Type' => 'multipart/form-data',
  'Accept' => 'application/json',
  'Authorization' => 'API_KEY'
}

result = RestClient.post '/documents/',
  params: {
  'type' => 'string'
}, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Content-Type': 'multipart/form-data',
  'Accept': 'application/json',
  'Authorization': 'API_KEY'
}

r = requests.post('/documents/', params={
  'type': 'string'
}, headers = headers)

print r.json()

```

`POST /documents/`

Upload your new document

> Body parameter

```yaml
filepond: string

```

<h3 id="documentsadddocument-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|type|query|string|true|none|
|body|body|[UserAddUserDwollaDocument](#schemauseradduserdwolladocument)|false|none|
|» filepond|body|string(binary)|true|none|

> Example responses

> 200 Response

```json
{
  "id": "string",
  "name": "string",
  "type": "string",
  "status": "string",
  "createdOn": "2019-02-09T08:01:37Z",
  "failureReason": "string"
}
```

<h3 id="documentsadddocument-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|[DocumentResponse](#schemadocumentresponse)|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
api_key
</aside>

## DocumentsGetDocuments

<a id="opIdDocumentsGetDocuments"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json',
  'Authorization' => 'API_KEY'
}

result = RestClient.get '/documents/',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json',
  'Authorization': 'API_KEY'
}

r = requests.get('/documents/', params={

}, headers = headers)

print r.json()

```

`GET /documents/`

Get a list of your documents

<h3 id="documentsgetdocuments-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|type|query|string|false|none|
|page|query|number(double)|false|none|
|limit|query|number(double)|false|none|

> Example responses

> 200 Response

```json
{
  "items": [
    {
      "id": "string",
      "name": "string",
      "type": "string",
      "status": "string",
      "createdOn": "2019-02-09T08:01:37Z",
      "failureReason": "string"
    }
  ],
  "pagination": {
    "total": 0,
    "limit": 0,
    "page": 0,
    "pages": 0
  }
}
```

<h3 id="documentsgetdocuments-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|[PaginatedDocumentResponse](#schemapaginateddocumentresponse)|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
api_key
</aside>

## DocumentsDeleteDocument

<a id="opIdDocumentsDeleteDocument"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Authorization' => 'API_KEY'
}

result = RestClient.delete '/documents/{id}',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Authorization': 'API_KEY'
}

r = requests.delete('/documents/{id}', params={

}, headers = headers)

print r.json()

```

`DELETE /documents/{id}`

Delete your document

<h3 id="documentsdeletedocument-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id|path|string|true|none|

<h3 id="documentsdeletedocument-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|204|[No Content](https://tools.ietf.org/html/rfc7231#section-6.3.5)|No content|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
api_key
</aside>

## DocumentsGetDocumentDownloadLink

<a id="opIdDocumentsGetDocumentDownloadLink"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'text/html',
  'Authorization' => 'API_KEY'
}

result = RestClient.get '/documents/{id}',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'text/html',
  'Authorization': 'API_KEY'
}

r = requests.get('/documents/{id}', params={

}, headers = headers)

print r.json()

```

`GET /documents/{id}`

Get your download link for a document

<h3 id="documentsgetdocumentdownloadlink-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id|path|string|true|none|

> Example responses

> 200 Response

<h3 id="documentsgetdocumentdownloadlink-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|string|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
api_key
</aside>

<h1 id="thor-api-fundingsources">fundingSources</h1>

## FundingSourceInitiateFundingSourceVerification

<a id="opIdFundingSourceInitiateFundingSourceVerification"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Authorization' => 'API_KEY'
}

result = RestClient.post '/fundingSources/{id}/verify',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Authorization': 'API_KEY'
}

r = requests.post('/fundingSources/{id}/verify', params={

}, headers = headers)

print r.json()

```

`POST /fundingSources/{id}/verify`

Trigger the micro-deposit verification process for a funding source

<h3 id="fundingsourceinitiatefundingsourceverification-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id|path|string|true|none|

<h3 id="fundingsourceinitiatefundingsourceverification-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|204|[No Content](https://tools.ietf.org/html/rfc7231#section-6.3.5)|No content|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
api_key
</aside>

## FundingSourceVerifyFundingSource

<a id="opIdFundingSourceVerifyFundingSource"></a>

> Code samples

```ruby
require 'rest-client'
require 'json'

headers = {
  'Content-Type' => 'application/json',
  'Authorization' => 'API_KEY'
}

result = RestClient.patch '/fundingSources/{id}/verify',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Content-Type': 'application/json',
  'Authorization': 'API_KEY'
}

r = requests.patch('/fundingSources/{id}/verify', params={

}, headers = headers)

print r.json()

```

`PATCH /fundingSources/{id}/verify`

Verify a funding source using micro-deposits

> Body parameter

```json
{
  "amount1": 0,
  "amount2": 0
}
```

<h3 id="fundingsourceverifyfundingsource-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id|path|string|true|none|
|body|body|[models.FundingSourceVerificationRequest](#schemamodels.fundingsourceverificationrequest)|true|none|

<h3 id="fundingsourceverifyfundingsource-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|204|[No Content](https://tools.ietf.org/html/rfc7231#section-6.3.5)|No content|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
api_key
</aside>

# Schemas

<h2 id="tocSchangepasswordrequest">ChangePasswordRequest</h2>

<a id="schemachangepasswordrequest"></a>

```json
{
  "oldPassword": "string",
  "newPassword": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|oldPassword|string|true|none|none|
|newPassword|string|true|none|none|

<h2 id="tocSrole.models.roleresponse">role.models.RoleResponse</h2>

<a id="schemarole.models.roleresponse"></a>

```json
{
  "name": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|name|string|true|none|none|

<h2 id="tocSprofile.profileresponse">profile.ProfileResponse</h2>

<a id="schemaprofile.profileresponse"></a>

```json
{
  "id": "string",
  "userId": "string",
  "tenantId": "string",
  "paymentsStatus": "string",
  "paymentsType": "string",
  "status": "string",
  "roles": [
    {
      "name": "string"
    }
  ],
  "createdAt": "2019-02-09T08:01:37Z",
  "updatedAt": "2019-02-09T08:01:37Z",
  "firstName": "string",
  "lastName": "string",
  "phone": "string",
  "email": "string",
  "country": "string",
  "state": "string",
  "city": "string",
  "postalCode": "string",
  "address1": "string",
  "address2": "string",
  "dateOfBirth": "2019-02-09T08:01:37Z"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|id|string|true|none|none|
|userId|string|true|none|none|
|tenantId|string|true|none|none|
|paymentsStatus|string|true|none|none|
|paymentsType|string|true|none|none|
|status|string|true|none|none|
|roles|[[role.models.RoleResponse](#schemarole.models.roleresponse)]|true|none|none|
|createdAt|string(date-time)|true|none|none|
|updatedAt|string(date-time)|true|none|none|
|firstName|string|true|none|none|
|lastName|string|true|none|none|
|phone|string|true|none|none|
|email|string|true|none|none|
|country|string|true|none|none|
|state|string|true|none|none|
|city|string|true|none|none|
|postalCode|string|true|none|none|
|address1|string|true|none|none|
|address2|string|true|none|none|
|dateOfBirth|string(date-time)|true|none|none|

<h2 id="tocSauthuserresponse">AuthUserResponse</h2>

<a id="schemaauthuserresponse"></a>

```json
{
  "token": "string",
  "id": "string",
  "createdAt": "2019-02-09T08:01:37Z",
  "updatedAt": "2019-02-09T08:01:37Z",
  "lastTransaction": "2019-02-09T08:01:37Z",
  "lastActivity": "2019-02-09T08:01:37Z",
  "rank": 0,
  "prev": 0,
  "tenantProfile": {
    "id": "string",
    "userId": "string",
    "tenantId": "string",
    "paymentsStatus": "string",
    "paymentsType": "string",
    "status": "string",
    "roles": [
      {
        "name": "string"
      }
    ],
    "createdAt": "2019-02-09T08:01:37Z",
    "updatedAt": "2019-02-09T08:01:37Z",
    "firstName": "string",
    "lastName": "string",
    "phone": "string",
    "email": "string",
    "country": "string",
    "state": "string",
    "city": "string",
    "postalCode": "string",
    "address1": "string",
    "address2": "string",
    "dateOfBirth": "2019-02-09T08:01:37Z"
  }
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|token|string|true|none|none|
|id|string|true|none|none|
|createdAt|string(date-time)|true|none|none|
|updatedAt|string(date-time)|true|none|none|
|lastTransaction|string(date-time)|true|none|none|
|lastActivity|string(date-time)|true|none|none|
|rank|number(double)|true|none|none|
|prev|number(double)|true|none|none|
|tenantProfile|[profile.ProfileResponse](#schemaprofile.profileresponse)|true|none|none|

<h2 id="tocSloginrequest">LoginRequest</h2>

<a id="schemaloginrequest"></a>

```json
{
  "login": "string",
  "password": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|login|string|true|none|none|
|password|string|true|none|none|

<h2 id="tocSregisteruserrequest">RegisterUserRequest</h2>

<a id="schemaregisteruserrequest"></a>

```json
{
  "invitationToken": "string",
  "email": "string",
  "password": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|invitationToken|string|true|none|none|
|email|string|true|none|none|
|password|string|true|none|none|

<h2 id="tocSresetpasswordrequest">ResetPasswordRequest</h2>

<a id="schemaresetpasswordrequest"></a>

```json
{
  "resetToken": "string",
  "newPassword": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|resetToken|string|true|none|none|
|newPassword|string|true|none|none|

<h2 id="tocSdto.userresponse">dto.UserResponse</h2>

<a id="schemadto.userresponse"></a>

```json
{
  "id": "string",
  "createdAt": "2019-02-09T08:01:37Z",
  "updatedAt": "2019-02-09T08:01:37Z",
  "lastTransaction": "2019-02-09T08:01:37Z",
  "lastActivity": "2019-02-09T08:01:37Z",
  "rank": 0,
  "prev": 0,
  "tenantProfile": {
    "id": "string",
    "userId": "string",
    "tenantId": "string",
    "paymentsStatus": "string",
    "paymentsType": "string",
    "status": "string",
    "roles": [
      {
        "name": "string"
      }
    ],
    "createdAt": "2019-02-09T08:01:37Z",
    "updatedAt": "2019-02-09T08:01:37Z",
    "firstName": "string",
    "lastName": "string",
    "phone": "string",
    "email": "string",
    "country": "string",
    "state": "string",
    "city": "string",
    "postalCode": "string",
    "address1": "string",
    "address2": "string",
    "dateOfBirth": "2019-02-09T08:01:37Z"
  }
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|id|string|true|none|none|
|createdAt|string(date-time)|true|none|none|
|updatedAt|string(date-time)|true|none|none|
|lastTransaction|string(date-time)|true|none|none|
|lastActivity|string(date-time)|true|none|none|
|rank|number(double)|true|none|none|
|prev|number(double)|true|none|none|
|tenantProfile|[profile.ProfileResponse](#schemaprofile.profileresponse)|true|none|none|

<h2 id="tocSrankingjobsentry">RankingJobsEntry</h2>

<a id="schemarankingjobsentry"></a>

```json
{
  "name": "string",
  "total": 0,
  "jobs": 0,
  "status": "string",
  "id": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|name|string|true|none|none|
|total|number(double)|true|none|none|
|jobs|number(double)|true|none|none|
|status|string|true|none|none|
|id|string|true|none|none|

<h2 id="tocSrankingjobsresponse">RankingJobsResponse</h2>

<a id="schemarankingjobsresponse"></a>

```json
{
  "id": "string",
  "rank": 0,
  "firstName": "string",
  "lastName": "string",
  "total": 0,
  "jobsCount": 0,
  "transactionsIds": [
    "string"
  ],
  "jobs": [
    {
      "name": "string",
      "total": 0,
      "jobs": 0,
      "status": "string",
      "id": "string"
    }
  ]
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|id|string|true|none|none|
|rank|number(double)|true|none|none|
|firstName|string|true|none|none|
|lastName|string|true|none|none|
|total|number(double)|true|none|none|
|jobsCount|number(double)|true|none|none|
|transactionsIds|[string]|true|none|none|
|jobs|[[RankingJobsEntry](#schemarankingjobsentry)]|true|none|none|

<h2 id="tocSpagination">Pagination</h2>

<a id="schemapagination"></a>

```json
{
  "total": 0,
  "limit": 0,
  "page": 0,
  "pages": 0
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|total|number(double)|true|none|none|
|limit|number(double)|true|none|none|
|page|number(double)|true|none|none|
|pages|number(double)|true|none|none|

<h2 id="tocSdto.paginatedrankingjobsresponse">dto.PaginatedRankingJobsResponse</h2>

<a id="schemadto.paginatedrankingjobsresponse"></a>

```json
{
  "items": [
    {
      "id": "string",
      "rank": 0,
      "firstName": "string",
      "lastName": "string",
      "total": 0,
      "jobsCount": 0,
      "transactionsIds": [
        "string"
      ],
      "jobs": [
        {
          "name": "string",
          "total": 0,
          "jobs": 0,
          "status": "string",
          "id": "string"
        }
      ]
    }
  ],
  "pagination": {
    "total": 0,
    "limit": 0,
    "page": 0,
    "pages": 0
  }
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|items|[[RankingJobsResponse](#schemarankingjobsresponse)]|true|none|none|
|pagination|[Pagination](#schemapagination)|true|none|none|

<h2 id="tocSuserresponse">UserResponse</h2>

<a id="schemauserresponse"></a>

```json
{
  "id": "string",
  "createdAt": "2019-02-09T08:01:37Z",
  "updatedAt": "2019-02-09T08:01:37Z",
  "lastTransaction": "2019-02-09T08:01:37Z",
  "lastActivity": "2019-02-09T08:01:37Z",
  "rank": 0,
  "prev": 0,
  "tenantProfile": {
    "id": "string",
    "userId": "string",
    "tenantId": "string",
    "paymentsStatus": "string",
    "paymentsType": "string",
    "status": "string",
    "roles": [
      {
        "name": "string"
      }
    ],
    "createdAt": "2019-02-09T08:01:37Z",
    "updatedAt": "2019-02-09T08:01:37Z",
    "firstName": "string",
    "lastName": "string",
    "phone": "string",
    "email": "string",
    "country": "string",
    "state": "string",
    "city": "string",
    "postalCode": "string",
    "address1": "string",
    "address2": "string",
    "dateOfBirth": "2019-02-09T08:01:37Z"
  }
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|id|string|true|none|none|
|createdAt|string(date-time)|true|none|none|
|updatedAt|string(date-time)|true|none|none|
|lastTransaction|string(date-time)|true|none|none|
|lastActivity|string(date-time)|true|none|none|
|rank|number(double)|true|none|none|
|prev|number(double)|true|none|none|
|tenantProfile|[profile.ProfileResponse](#schemaprofile.profileresponse)|true|none|none|

<h2 id="tocSdto.paginateduserresponse">dto.PaginatedUserResponse</h2>

<a id="schemadto.paginateduserresponse"></a>

```json
{
  "items": [
    {
      "id": "string",
      "createdAt": "2019-02-09T08:01:37Z",
      "updatedAt": "2019-02-09T08:01:37Z",
      "lastTransaction": "2019-02-09T08:01:37Z",
      "lastActivity": "2019-02-09T08:01:37Z",
      "rank": 0,
      "prev": 0,
      "tenantProfile": {
        "id": "string",
        "userId": "string",
        "tenantId": "string",
        "paymentsStatus": "string",
        "paymentsType": "string",
        "status": "string",
        "roles": [
          {
            "name": "string"
          }
        ],
        "createdAt": "2019-02-09T08:01:37Z",
        "updatedAt": "2019-02-09T08:01:37Z",
        "firstName": "string",
        "lastName": "string",
        "phone": "string",
        "email": "string",
        "country": "string",
        "state": "string",
        "city": "string",
        "postalCode": "string",
        "address1": "string",
        "address2": "string",
        "dateOfBirth": "2019-02-09T08:01:37Z"
      }
    }
  ],
  "pagination": {
    "total": 0,
    "limit": 0,
    "page": 0,
    "pages": 0
  }
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|items|[[UserResponse](#schemauserresponse)]|true|none|none|
|pagination|[Pagination](#schemapagination)|true|none|none|

<h2 id="tocSprofileresponse">ProfileResponse</h2>

<a id="schemaprofileresponse"></a>

```json
{
  "id": "string",
  "userId": "string",
  "tenantId": "string",
  "paymentsStatus": "string",
  "paymentsType": "string",
  "status": "string",
  "roles": [
    {
      "name": "string"
    }
  ],
  "createdAt": "2019-02-09T08:01:37Z",
  "updatedAt": "2019-02-09T08:01:37Z",
  "firstName": "string",
  "lastName": "string",
  "phone": "string",
  "email": "string",
  "country": "string",
  "state": "string",
  "city": "string",
  "postalCode": "string",
  "address1": "string",
  "address2": "string",
  "dateOfBirth": "2019-02-09T08:01:37Z"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|id|string|true|none|none|
|userId|string|true|none|none|
|tenantId|string|true|none|none|
|paymentsStatus|string|true|none|none|
|paymentsType|string|true|none|none|
|status|string|true|none|none|
|roles|[[role.models.RoleResponse](#schemarole.models.roleresponse)]|true|none|none|
|createdAt|string(date-time)|true|none|none|
|updatedAt|string(date-time)|true|none|none|
|firstName|string|true|none|none|
|lastName|string|true|none|none|
|phone|string|true|none|none|
|email|string|true|none|none|
|country|string|true|none|none|
|state|string|true|none|none|
|city|string|true|none|none|
|postalCode|string|true|none|none|
|address1|string|true|none|none|
|address2|string|true|none|none|
|dateOfBirth|string(date-time)|true|none|none|

<h2 id="tocSprofile.profilepatchrequest">profile.ProfilePatchRequest</h2>

<a id="schemaprofile.profilepatchrequest"></a>

```json
{
  "firstName": "string",
  "lastName": "string",
  "phone": "string",
  "email": "string",
  "country": "string",
  "state": "string",
  "city": "string",
  "postalCode": "string",
  "address1": "string",
  "address2": "string",
  "dateOfBirth": "2019-02-09T08:01:37Z"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|firstName|string|true|none|none|
|lastName|string|true|none|none|
|phone|string|true|none|none|
|email|string|true|none|none|
|country|string|true|none|none|
|state|string|true|none|none|
|city|string|true|none|none|
|postalCode|string|true|none|none|
|address1|string|true|none|none|
|address2|string|true|none|none|
|dateOfBirth|string(date-time)|true|none|none|

<h2 id="tocSdto.userpatchrequest">dto.UserPatchRequest</h2>

<a id="schemadto.userpatchrequest"></a>

```json
{
  "profile": {
    "firstName": "string",
    "lastName": "string",
    "phone": "string",
    "email": "string",
    "country": "string",
    "state": "string",
    "city": "string",
    "postalCode": "string",
    "address1": "string",
    "address2": "string",
    "dateOfBirth": "2019-02-09T08:01:37Z"
  }
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|profile|[profile.ProfilePatchRequest](#schemaprofile.profilepatchrequest)|true|none|none|

<h2 id="tocSjob.jobresponse">job.JobResponse</h2>

<a id="schemajob.jobresponse"></a>

```json
{
  "id": "string",
  "createdAt": "2019-02-09T08:01:37Z",
  "updatedAt": "2019-02-09T08:01:37Z",
  "isActive": true,
  "value": 0,
  "name": "string",
  "description": "string",
  "isCustom": true
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|id|string|true|none|none|
|createdAt|string(date-time)|true|none|none|
|updatedAt|string(date-time)|true|none|none|
|isActive|boolean|true|none|none|
|value|number(double)|true|none|none|
|name|string|true|none|none|
|description|string|true|none|none|
|isCustom|boolean|true|none|none|

<h2 id="tocStransactionresponse">TransactionResponse</h2>

<a id="schematransactionresponse"></a>

```json
{
  "id": "string",
  "status": "string",
  "createdAt": "2019-02-09T08:01:37Z",
  "updatedAt": "2019-02-09T08:01:37Z",
  "job": {
    "id": "string",
    "createdAt": "2019-02-09T08:01:37Z",
    "updatedAt": "2019-02-09T08:01:37Z",
    "isActive": true,
    "value": 0,
    "name": "string",
    "description": "string",
    "isCustom": true
  },
  "value": 0,
  "userId": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|id|string|true|none|none|
|status|string|true|none|none|
|createdAt|string(date-time)|true|none|none|
|updatedAt|string(date-time)|true|none|none|
|job|[job.JobResponse](#schemajob.jobresponse)|true|none|none|
|value|number(double)|true|none|none|
|userId|string|true|none|none|

<h2 id="tocStransactions.paginatedtransactionresponse">transactions.PaginatedTransactionResponse</h2>

<a id="schematransactions.paginatedtransactionresponse"></a>

```json
{
  "items": [
    {
      "id": "string",
      "status": "string",
      "createdAt": "2019-02-09T08:01:37Z",
      "updatedAt": "2019-02-09T08:01:37Z",
      "job": {
        "id": "string",
        "createdAt": "2019-02-09T08:01:37Z",
        "updatedAt": "2019-02-09T08:01:37Z",
        "isActive": true,
        "value": 0,
        "name": "string",
        "description": "string",
        "isCustom": true
      },
      "value": 0,
      "userId": "string"
    }
  ],
  "pagination": {
    "total": 0,
    "limit": 0,
    "page": 0,
    "pages": 0
  }
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|items|[[TransactionResponse](#schematransactionresponse)]|true|none|none|
|pagination|[Pagination](#schemapagination)|true|none|none|

<h2 id="tocSdto.userstatisticsresponse">dto.UserStatisticsResponse</h2>

<a id="schemadto.userstatisticsresponse"></a>

```json
{
  "rank": 0,
  "nJobs": 0,
  "prev": 0,
  "current": 0,
  "ytd": 0
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|rank|number(double)|true|none|none|
|nJobs|number(double)|true|none|none|
|prev|number(double)|true|none|none|
|current|number(double)|true|none|none|
|ytd|number(double)|true|none|none|

<h2 id="tocSadminuserprofilerequest">AdminUserProfileRequest</h2>

<a id="schemaadminuserprofilerequest"></a>

```json
{
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "role": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|firstName|string|true|none|none|
|lastName|string|true|none|none|
|email|string|true|none|none|
|role|string|true|none|none|

<h2 id="tocSdto.adminuserrequest">dto.AdminUserRequest</h2>

<a id="schemadto.adminuserrequest"></a>

```json
{
  "profile": {
    "firstName": "string",
    "lastName": "string",
    "email": "string",
    "role": "string"
  }
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|profile|[AdminUserProfileRequest](#schemaadminuserprofilerequest)|true|none|none|

<h2 id="tocSdto.addcontractoruserresponse">dto.AddContractorUserResponse</h2>

<a id="schemadto.addcontractoruserresponse"></a>

```json
{
  "id": "string",
  "createdAt": "2019-02-09T08:01:37Z",
  "updatedAt": "2019-02-09T08:01:37Z",
  "lastActivity": "2019-02-09T08:01:37Z",
  "tenantProfile": {
    "id": "string",
    "userId": "string",
    "tenantId": "string",
    "paymentsStatus": "string",
    "paymentsType": "string",
    "status": "string",
    "roles": [
      {
        "name": "string"
      }
    ],
    "createdAt": "2019-02-09T08:01:37Z",
    "updatedAt": "2019-02-09T08:01:37Z",
    "firstName": "string",
    "lastName": "string",
    "phone": "string",
    "email": "string",
    "country": "string",
    "state": "string",
    "city": "string",
    "postalCode": "string",
    "address1": "string",
    "address2": "string",
    "dateOfBirth": "2019-02-09T08:01:37Z"
  },
  "token": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|id|string|true|none|none|
|createdAt|string(date-time)|true|none|none|
|updatedAt|string(date-time)|true|none|none|
|lastActivity|string(date-time)|true|none|none|
|tenantProfile|[profile.ProfileResponse](#schemaprofile.profileresponse)|true|none|none|
|token|string|true|none|none|

<h2 id="tocSprofile.profilerequest">profile.ProfileRequest</h2>

<a id="schemaprofile.profilerequest"></a>

```json
{
  "ssn": "string",
  "externalId": "string",
  "firstName": "string",
  "lastName": "string",
  "phone": "string",
  "email": "string",
  "country": "string",
  "state": "string",
  "city": "string",
  "postalCode": "string",
  "address1": "string",
  "address2": "string",
  "dateOfBirth": "2019-02-09T08:01:37Z"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|ssn|string|true|none|none|
|externalId|string|true|none|none|
|firstName|string|true|none|none|
|lastName|string|true|none|none|
|phone|string|true|none|none|
|email|string|true|none|none|
|country|string|true|none|none|
|state|string|true|none|none|
|city|string|true|none|none|
|postalCode|string|true|none|none|
|address1|string|true|none|none|
|address2|string|true|none|none|
|dateOfBirth|string(date-time)|true|none|none|

<h2 id="tocSdto.addcontractoruserrequest">dto.AddContractorUserRequest</h2>

<a id="schemadto.addcontractoruserrequest"></a>

```json
{
  "profile": {
    "ssn": "string",
    "externalId": "string",
    "firstName": "string",
    "lastName": "string",
    "phone": "string",
    "email": "string",
    "country": "string",
    "state": "string",
    "city": "string",
    "postalCode": "string",
    "address1": "string",
    "address2": "string",
    "dateOfBirth": "2019-02-09T08:01:37Z"
  }
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|profile|[profile.ProfileRequest](#schemaprofile.profilerequest)|true|none|none|

<h2 id="tocSdto.contractoronretryresponse">dto.ContractorOnRetryResponse</h2>

<a id="schemadto.contractoronretryresponse"></a>

```json
{
  "id": "string",
  "createdAt": "2019-02-09T08:01:37Z",
  "updatedAt": "2019-02-09T08:01:37Z",
  "lastActivity": "2019-02-09T08:01:37Z",
  "tenantProfile": {
    "id": "string",
    "userId": "string",
    "tenantId": "string",
    "paymentsStatus": "string",
    "paymentsType": "string",
    "status": "string",
    "roles": [
      {
        "name": "string"
      }
    ],
    "createdAt": "2019-02-09T08:01:37Z",
    "updatedAt": "2019-02-09T08:01:37Z",
    "firstName": "string",
    "lastName": "string",
    "phone": "string",
    "email": "string",
    "country": "string",
    "state": "string",
    "city": "string",
    "postalCode": "string",
    "address1": "string",
    "address2": "string",
    "dateOfBirth": "2019-02-09T08:01:37Z"
  }
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|id|string|true|none|none|
|createdAt|string(date-time)|true|none|none|
|updatedAt|string(date-time)|true|none|none|
|lastActivity|string(date-time)|true|none|none|
|tenantProfile|[profile.ProfileResponse](#schemaprofile.profileresponse)|true|none|none|

<h2 id="tocSprofile.profilebaseinfo">profile.ProfileBaseInfo</h2>

<a id="schemaprofile.profilebaseinfo"></a>

```json
{
  "firstName": "string",
  "lastName": "string",
  "phone": "string",
  "email": "string",
  "country": "string",
  "state": "string",
  "city": "string",
  "postalCode": "string",
  "address1": "string",
  "address2": "string",
  "dateOfBirth": "2019-02-09T08:01:37Z"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|firstName|string|true|none|none|
|lastName|string|true|none|none|
|phone|string|true|none|none|
|email|string|true|none|none|
|country|string|true|none|none|
|state|string|true|none|none|
|city|string|true|none|none|
|postalCode|string|true|none|none|
|address1|string|true|none|none|
|address2|string|true|none|none|
|dateOfBirth|string(date-time)|true|none|none|

<h2 id="tocSdto.contractoronretryrequest">dto.ContractorOnRetryRequest</h2>

<a id="schemadto.contractoronretryrequest"></a>

```json
{
  "profile": {
    "firstName": "string",
    "lastName": "string",
    "phone": "string",
    "email": "string",
    "country": "string",
    "state": "string",
    "city": "string",
    "postalCode": "string",
    "address1": "string",
    "address2": "string",
    "dateOfBirth": "2019-02-09T08:01:37Z"
  }
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|profile|[profile.ProfileBaseInfo](#schemaprofile.profilebaseinfo)|true|none|none|

<h2 id="tocSdocuments.documentresponse">documents.DocumentResponse</h2>

<a id="schemadocuments.documentresponse"></a>

```json
{
  "id": "string",
  "name": "string",
  "type": "string",
  "status": "string",
  "createdOn": "2019-02-09T08:01:37Z",
  "failureReason": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|id|string|true|none|none|
|name|string|true|none|none|
|type|string|true|none|none|
|status|string|true|none|none|
|createdOn|string(date-time)|true|none|none|
|failureReason|string|true|none|none|

<h2 id="tocSdocumentresponse">DocumentResponse</h2>

<a id="schemadocumentresponse"></a>

```json
{
  "id": "string",
  "name": "string",
  "type": "string",
  "status": "string",
  "createdOn": "2019-02-09T08:01:37Z",
  "failureReason": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|id|string|true|none|none|
|name|string|true|none|none|
|type|string|true|none|none|
|status|string|true|none|none|
|createdOn|string(date-time)|true|none|none|
|failureReason|string|true|none|none|

<h2 id="tocSdocuments.paginateddocumentresponse">documents.PaginatedDocumentResponse</h2>

<a id="schemadocuments.paginateddocumentresponse"></a>

```json
{
  "items": [
    {
      "id": "string",
      "name": "string",
      "type": "string",
      "status": "string",
      "createdOn": "2019-02-09T08:01:37Z",
      "failureReason": "string"
    }
  ],
  "pagination": {
    "total": 0,
    "limit": 0,
    "page": 0,
    "pages": 0
  }
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|items|[[DocumentResponse](#schemadocumentresponse)]|true|none|none|
|pagination|[Pagination](#schemapagination)|true|none|none|

<h2 id="tocSmodels.tenantresponse">models.TenantResponse</h2>

<a id="schemamodels.tenantresponse"></a>

```json
{
  "id": "string",
  "createdAt": "2019-02-09T08:01:37Z",
  "updatedAt": "2019-02-09T08:01:37Z",
  "status": "string",
  "settings": {},
  "name": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|id|string|true|none|none|
|createdAt|string(date-time)|true|none|none|
|updatedAt|string(date-time)|true|none|none|
|status|string|true|none|none|
|settings|object|true|none|none|
|name|string|true|none|none|

<h2 id="tocSmodels.tenantrequest">models.TenantRequest</h2>

<a id="schemamodels.tenantrequest"></a>

```json
{
  "name": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|name|string|true|none|none|

<h2 id="tocSmodels.tenantcompanyresponse">models.TenantCompanyResponse</h2>

<a id="schemamodels.tenantcompanyresponse"></a>

```json
{
  "firstName": "string",
  "lastName": "string",
  "phone": "string",
  "email": "string",
  "country": "string",
  "state": "string",
  "city": "string",
  "postalCode": "string",
  "address1": "string",
  "address2": "string",
  "businessName": "string",
  "doingBusinessAs": "string",
  "businessType": "string",
  "businessClassification": "string",
  "website": "string",
  "status": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|firstName|string|true|none|none|
|lastName|string|true|none|none|
|phone|string|true|none|none|
|email|string|true|none|none|
|country|string|true|none|none|
|state|string|true|none|none|
|city|string|true|none|none|
|postalCode|string|true|none|none|
|address1|string|true|none|none|
|address2|string|true|none|none|
|businessName|string|false|none|none|
|doingBusinessAs|string|false|none|none|
|businessType|string|false|none|none|
|businessClassification|string|false|none|none|
|website|string|false|none|none|
|status|string|true|none|none|

<h2 id="tocStenantcontrolleraddress">TenantControllerAddress</h2>

<a id="schematenantcontrolleraddress"></a>

```json
{
  "address1": "string",
  "address2": "string",
  "city": "string",
  "stateProvinceRegion": "string",
  "postalCode": "string",
  "country": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|address1|string|true|none|none|
|address2|string|true|none|none|
|city|string|true|none|none|
|stateProvinceRegion|string|true|none|none|
|postalCode|string|true|none|none|
|country|string|true|none|none|

<h2 id="tocStenantcontroller">TenantController</h2>

<a id="schematenantcontroller"></a>

```json
{
  "firstName": "string",
  "lastName": "string",
  "title": "string",
  "dateOfBirth": "string",
  "ssn": "string",
  "address": {
    "address1": "string",
    "address2": "string",
    "city": "string",
    "stateProvinceRegion": "string",
    "postalCode": "string",
    "country": "string"
  }
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|firstName|string|true|none|none|
|lastName|string|true|none|none|
|title|string|true|none|none|
|dateOfBirth|string|true|none|none|
|ssn|string|true|none|none|
|address|[TenantControllerAddress](#schematenantcontrolleraddress)|true|none|none|

<h2 id="tocSmodels.tenantcompanyrequest">models.TenantCompanyRequest</h2>

<a id="schemamodels.tenantcompanyrequest"></a>

```json
{
  "businessName": "string",
  "doingBusinessAs": "string",
  "businessType": "string",
  "businessClassification": "string",
  "address1": "string",
  "address2": "string",
  "city": "string",
  "state": "string",
  "postalCode": "string",
  "phone": "string",
  "ein": "string",
  "website": "string",
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "dateOfBirth": "string",
  "ssn": "string",
  "controller": {
    "firstName": "string",
    "lastName": "string",
    "title": "string",
    "dateOfBirth": "string",
    "ssn": "string",
    "address": {
      "address1": "string",
      "address2": "string",
      "city": "string",
      "stateProvinceRegion": "string",
      "postalCode": "string",
      "country": "string"
    }
  }
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|businessName|string|true|none|none|
|doingBusinessAs|string|true|none|none|
|businessType|string|true|none|none|
|businessClassification|string|true|none|none|
|address1|string|true|none|none|
|address2|string|true|none|none|
|city|string|true|none|none|
|state|string|true|none|none|
|postalCode|string|true|none|none|
|phone|string|true|none|none|
|ein|string|true|none|none|
|website|string|true|none|none|
|firstName|string|true|none|none|
|lastName|string|true|none|none|
|email|string|true|none|none|
|dateOfBirth|string|true|none|none|
|ssn|string|true|none|none|
|controller|[TenantController](#schematenantcontroller)|true|none|none|

<h2 id="tocSmodels.tenantcompanypatchrequest">models.TenantCompanyPatchRequest</h2>

<a id="schemamodels.tenantcompanypatchrequest"></a>

```json
{
  "phone": "string",
  "email": "string",
  "country": "string",
  "state": "string",
  "city": "string",
  "postalCode": "string",
  "address1": "string",
  "address2": "string",
  "doingBusinessAs": "string",
  "website": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|phone|string|true|none|none|
|email|string|true|none|none|
|country|string|true|none|none|
|state|string|true|none|none|
|city|string|true|none|none|
|postalCode|string|true|none|none|
|address1|string|true|none|none|
|address2|string|true|none|none|
|doingBusinessAs|string|true|none|none|
|website|string|true|none|none|

<h2 id="tocSmodels.tenantcompanyretryrequest">models.TenantCompanyRetryRequest</h2>

<a id="schemamodels.tenantcompanyretryrequest"></a>

```json
{
  "businessName": "string",
  "doingBusinessAs": "string",
  "businessType": "string",
  "businessClassification": "string",
  "address1": "string",
  "address2": "string",
  "city": "string",
  "state": "string",
  "postalCode": "string",
  "phone": "string",
  "ein": "string",
  "website": "string",
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "dateOfBirth": "string",
  "ssn": "string",
  "controller": {
    "firstName": "string",
    "lastName": "string",
    "title": "string",
    "dateOfBirth": "string",
    "ssn": "string",
    "address": {
      "address1": "string",
      "address2": "string",
      "city": "string",
      "stateProvinceRegion": "string",
      "postalCode": "string",
      "country": "string"
    }
  }
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|businessName|string|true|none|none|
|doingBusinessAs|string|true|none|none|
|businessType|string|true|none|none|
|businessClassification|string|true|none|none|
|address1|string|true|none|none|
|address2|string|true|none|none|
|city|string|true|none|none|
|state|string|true|none|none|
|postalCode|string|true|none|none|
|phone|string|true|none|none|
|ein|string|true|none|none|
|website|string|true|none|none|
|firstName|string|true|none|none|
|lastName|string|true|none|none|
|email|string|true|none|none|
|dateOfBirth|string|true|none|none|
|ssn|string|true|none|none|
|controller|[TenantController](#schematenantcontroller)|true|none|none|

<h2 id="tocStenantowneraddressresponse">TenantOwnerAddressResponse</h2>

<a id="schematenantowneraddressresponse"></a>

```json
{
  "address1": "string",
  "address2": "string",
  "city": "string",
  "stateProvinceRegion": "string",
  "postalCode": "string",
  "country": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|address1|string|true|none|none|
|address2|string|true|none|none|
|city|string|true|none|none|
|stateProvinceRegion|string|true|none|none|
|postalCode|string|true|none|none|
|country|string|true|none|none|

<h2 id="tocSmodels.tenantownerresponse">models.TenantOwnerResponse</h2>

<a id="schemamodels.tenantownerresponse"></a>

```json
{
  "firstName": "string",
  "lastName": "string",
  "title": "string",
  "address": {
    "address1": "string",
    "address2": "string",
    "city": "string",
    "stateProvinceRegion": "string",
    "postalCode": "string",
    "country": "string"
  }
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|firstName|string|true|none|none|
|lastName|string|true|none|none|
|title|string|true|none|none|
|address|[TenantOwnerAddressResponse](#schematenantowneraddressresponse)|true|none|none|

<h2 id="tocStenantcompanydocument">TenantCompanyDocument</h2>

<a id="schematenantcompanydocument"></a>

```json
{
  "type": "string",
  "status": "string",
  "created": "2019-02-09T08:01:37Z",
  "failureReason": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|true|none|none|
|status|string|true|none|none|
|created|string(date-time)|true|none|none|
|failureReason|string|true|none|none|

<h2 id="tocSprofilerequest">ProfileRequest</h2>

<a id="schemaprofilerequest"></a>

```json
{
  "ssn": "string",
  "externalId": "string",
  "firstName": "string",
  "lastName": "string",
  "phone": "string",
  "email": "string",
  "country": "string",
  "state": "string",
  "city": "string",
  "postalCode": "string",
  "address1": "string",
  "address2": "string",
  "dateOfBirth": "2019-02-09T08:01:37Z"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|ssn|string|true|none|none|
|externalId|string|true|none|none|
|firstName|string|true|none|none|
|lastName|string|true|none|none|
|phone|string|true|none|none|
|email|string|true|none|none|
|country|string|true|none|none|
|state|string|true|none|none|
|city|string|true|none|none|
|postalCode|string|true|none|none|
|address1|string|true|none|none|
|address2|string|true|none|none|
|dateOfBirth|string(date-time)|true|none|none|

<h2 id="tocSmodels.transactionresponse">models.TransactionResponse</h2>

<a id="schemamodels.transactionresponse"></a>

```json
{
  "id": "string",
  "status": "string",
  "createdAt": "2019-02-09T08:01:37Z",
  "updatedAt": "2019-02-09T08:01:37Z",
  "job": {
    "id": "string",
    "createdAt": "2019-02-09T08:01:37Z",
    "updatedAt": "2019-02-09T08:01:37Z",
    "isActive": true,
    "value": 0,
    "name": "string",
    "description": "string",
    "isCustom": true
  },
  "value": 0,
  "userId": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|id|string|true|none|none|
|status|string|true|none|none|
|createdAt|string(date-time)|true|none|none|
|updatedAt|string(date-time)|true|none|none|
|job|[job.JobResponse](#schemajob.jobresponse)|true|none|none|
|value|number(double)|true|none|none|
|userId|string|true|none|none|

<h2 id="tocSmodels.paginatedtransactionresponse">models.PaginatedTransactionResponse</h2>

<a id="schemamodels.paginatedtransactionresponse"></a>

```json
{
  "items": [
    {
      "id": "string",
      "status": "string",
      "createdAt": "2019-02-09T08:01:37Z",
      "updatedAt": "2019-02-09T08:01:37Z",
      "job": {
        "id": "string",
        "createdAt": "2019-02-09T08:01:37Z",
        "updatedAt": "2019-02-09T08:01:37Z",
        "isActive": true,
        "value": 0,
        "name": "string",
        "description": "string",
        "isCustom": true
      },
      "value": 0,
      "userId": "string"
    }
  ],
  "pagination": {
    "total": 0,
    "limit": 0,
    "page": 0,
    "pages": 0
  }
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|items|[[TransactionResponse](#schematransactionresponse)]|true|none|none|
|pagination|[Pagination](#schemapagination)|true|none|none|

<h2 id="tocSmodels.transactionexistingjobrequest">models.TransactionExistingJobRequest</h2>

<a id="schemamodels.transactionexistingjobrequest"></a>

```json
{
  "jobId": "string",
  "externalId": "string",
  "userId": "string",
  "value": 0
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|jobId|string|true|none|none|
|externalId|string|true|none|none|
|userId|string|true|none|none|
|value|number(double)|true|none|none|

<h2 id="tocSjobrequest">JobRequest</h2>

<a id="schemajobrequest"></a>

```json
{
  "value": 0,
  "name": "string",
  "description": "string",
  "isCustom": true
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|value|number(double)|true|none|none|
|name|string|true|none|none|
|description|string|true|none|none|
|isCustom|boolean|true|none|none|

<h2 id="tocSmodels.transactioncustomjobrequest">models.TransactionCustomJobRequest</h2>

<a id="schemamodels.transactioncustomjobrequest"></a>

```json
{
  "job": {
    "value": 0,
    "name": "string",
    "description": "string",
    "isCustom": true
  },
  "externalId": "string",
  "userId": "string",
  "value": 0
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|job|[JobRequest](#schemajobrequest)|true|none|none|
|externalId|string|true|none|none|
|userId|string|true|none|none|
|value|number(double)|true|none|none|

<h2 id="tocSmodels.transactionpatchrequest">models.TransactionPatchRequest</h2>

<a id="schemamodels.transactionpatchrequest"></a>

```json
{
  "jobId": "string",
  "value": 0
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|jobId|string|true|none|none|
|value|number(double)|true|none|none|

<h2 id="tocSmodels.transferresponse">models.TransferResponse</h2>

<a id="schemamodels.transferresponse"></a>

```json
{
  "id": "string",
  "adminId": "string",
  "status": "string",
  "createdAt": "2019-02-09T08:01:37Z",
  "updatedAt": "2019-02-09T08:01:37Z",
  "value": 0
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|id|string|true|none|none|
|adminId|string|true|none|none|
|status|string|true|none|none|
|createdAt|string(date-time)|true|none|none|
|updatedAt|string(date-time)|true|none|none|
|value|number(double)|true|none|none|

<h2 id="tocSmodels.transactionstransferrequest">models.TransactionsTransferRequest</h2>

<a id="schemamodels.transactionstransferrequest"></a>

```json
{
  "transactionsIds": [
    "string"
  ]
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|transactionsIds|[string]|true|none|none|

<h2 id="tocSperiodstatsresponse">PeriodStatsResponse</h2>

<a id="schemaperiodstatsresponse"></a>

```json
{
  "users": 0,
  "total": 0,
  "startDate": "2019-02-09T08:01:37Z",
  "endDate": "2019-02-09T08:01:37Z"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|users|number(double)|true|none|none|
|total|number(double)|true|none|none|
|startDate|string(date-time)|true|none|none|
|endDate|string(date-time)|true|none|none|

<h2 id="tocSmodels.periodsstatsresponse">models.PeriodsStatsResponse</h2>

<a id="schemamodels.periodsstatsresponse"></a>

```json
{
  "previous": {
    "users": 0,
    "total": 0,
    "startDate": "2019-02-09T08:01:37Z",
    "endDate": "2019-02-09T08:01:37Z"
  },
  "current": {
    "users": 0,
    "total": 0,
    "startDate": "2019-02-09T08:01:37Z",
    "endDate": "2019-02-09T08:01:37Z"
  }
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|previous|[PeriodStatsResponse](#schemaperiodstatsresponse)|true|none|none|
|current|[PeriodStatsResponse](#schemaperiodstatsresponse)|true|none|none|

<h2 id="tocSmodels.jobresponse">models.JobResponse</h2>

<a id="schemamodels.jobresponse"></a>

```json
{
  "id": "string",
  "createdAt": "2019-02-09T08:01:37Z",
  "updatedAt": "2019-02-09T08:01:37Z",
  "isActive": true,
  "value": 0,
  "name": "string",
  "description": "string",
  "isCustom": true
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|id|string|true|none|none|
|createdAt|string(date-time)|true|none|none|
|updatedAt|string(date-time)|true|none|none|
|isActive|boolean|true|none|none|
|value|number(double)|true|none|none|
|name|string|true|none|none|
|description|string|true|none|none|
|isCustom|boolean|true|none|none|

<h2 id="tocSmodels.jobrequest">models.JobRequest</h2>

<a id="schemamodels.jobrequest"></a>

```json
{
  "value": 0,
  "name": "string",
  "description": "string",
  "isCustom": true
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|value|number(double)|true|none|none|
|name|string|true|none|none|
|description|string|true|none|none|
|isCustom|boolean|true|none|none|

<h2 id="tocSjobresponse">JobResponse</h2>

<a id="schemajobresponse"></a>

```json
{
  "id": "string",
  "createdAt": "2019-02-09T08:01:37Z",
  "updatedAt": "2019-02-09T08:01:37Z",
  "isActive": true,
  "value": 0,
  "name": "string",
  "description": "string",
  "isCustom": true
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|id|string|true|none|none|
|createdAt|string(date-time)|true|none|none|
|updatedAt|string(date-time)|true|none|none|
|isActive|boolean|true|none|none|
|value|number(double)|true|none|none|
|name|string|true|none|none|
|description|string|true|none|none|
|isCustom|boolean|true|none|none|

<h2 id="tocSmodels.paginatedjobresponse">models.PaginatedJobResponse</h2>

<a id="schemamodels.paginatedjobresponse"></a>

```json
{
  "items": [
    {
      "id": "string",
      "createdAt": "2019-02-09T08:01:37Z",
      "updatedAt": "2019-02-09T08:01:37Z",
      "isActive": true,
      "value": 0,
      "name": "string",
      "description": "string",
      "isCustom": true
    }
  ],
  "pagination": {
    "total": 0,
    "limit": 0,
    "page": 0,
    "pages": 0
  }
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|items|[[JobResponse](#schemajobresponse)]|true|none|none|
|pagination|[Pagination](#schemapagination)|true|none|none|

<h2 id="tocSmodels.jobpatchrequest">models.JobPatchRequest</h2>

<a id="schemamodels.jobpatchrequest"></a>

```json
{
  "isActive": true,
  "value": 0,
  "name": "string",
  "description": "string",
  "isCustom": true
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|isActive|boolean|true|none|none|
|value|number(double)|true|none|none|
|name|string|true|none|none|
|description|string|true|none|none|
|isCustom|boolean|true|none|none|

<h2 id="tocSievent">IEvent</h2>

<a id="schemaievent"></a>

```json
{
  "_links": {},
  "id": "string",
  "topic": "string",
  "resourceId": "string",
  "created": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|_links|object|true|none|none|
|id|string|true|none|none|
|topic|string|true|none|none|
|resourceId|string|true|none|none|
|created|string|true|none|none|

<h2 id="tocSinvitationresponse">InvitationResponse</h2>

<a id="schemainvitationresponse"></a>

```json
{
  "id": "string",
  "status": "string",
  "createdAt": "2019-02-09T08:01:37Z",
  "updatedAt": "2019-02-09T08:01:37Z",
  "email": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|id|string|true|none|none|
|status|string|true|none|none|
|createdAt|string(date-time)|true|none|none|
|updatedAt|string(date-time)|true|none|none|
|email|string|true|none|none|

<h2 id="tocSmodels.invitationpaginatedresponse">models.InvitationPaginatedResponse</h2>

<a id="schemamodels.invitationpaginatedresponse"></a>

```json
{
  "items": [
    {
      "id": "string",
      "status": "string",
      "createdAt": "2019-02-09T08:01:37Z",
      "updatedAt": "2019-02-09T08:01:37Z",
      "email": "string"
    }
  ],
  "pagination": {
    "total": 0,
    "limit": 0,
    "page": 0,
    "pages": 0
  }
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|items|[[InvitationResponse](#schemainvitationresponse)]|true|none|none|
|pagination|[Pagination](#schemapagination)|true|none|none|

<h2 id="tocSmodels.invitationresponse">models.InvitationResponse</h2>

<a id="schemamodels.invitationresponse"></a>

```json
{
  "id": "string",
  "status": "string",
  "createdAt": "2019-02-09T08:01:37Z",
  "updatedAt": "2019-02-09T08:01:37Z",
  "email": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|id|string|true|none|none|
|status|string|true|none|none|
|createdAt|string(date-time)|true|none|none|
|updatedAt|string(date-time)|true|none|none|
|email|string|true|none|none|

<h2 id="tocSmodels.invitationrequest">models.InvitationRequest</h2>

<a id="schemamodels.invitationrequest"></a>

```json
{
  "type": "string",
  "role": "string",
  "email": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|true|none|none|
|role|string|true|none|none|
|email|string|true|none|none|

<h2 id="tocSmodels.userinvitationrequest">models.UserInvitationRequest</h2>

<a id="schemamodels.userinvitationrequest"></a>

```json
{
  "userId": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|userId|string|true|none|none|

<h2 id="tocScontractorresponse">ContractorResponse</h2>

<a id="schemacontractorresponse"></a>

```json
{
  "id": "string",
  "createdAt": "2019-02-09T08:01:37Z",
  "updatedAt": "2019-02-09T08:01:37Z",
  "lastActivity": "2019-02-09T08:01:37Z",
  "tenantProfile": {
    "id": "string",
    "userId": "string",
    "tenantId": "string",
    "paymentsStatus": "string",
    "paymentsType": "string",
    "status": "string",
    "roles": [
      {
        "name": "string"
      }
    ],
    "createdAt": "2019-02-09T08:01:37Z",
    "updatedAt": "2019-02-09T08:01:37Z",
    "firstName": "string",
    "lastName": "string",
    "phone": "string",
    "email": "string",
    "country": "string",
    "state": "string",
    "city": "string",
    "postalCode": "string",
    "address1": "string",
    "address2": "string",
    "dateOfBirth": "2019-02-09T08:01:37Z"
  }
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|id|string|true|none|none|
|createdAt|string(date-time)|true|none|none|
|updatedAt|string(date-time)|true|none|none|
|lastActivity|string(date-time)|true|none|none|
|tenantProfile|[profile.ProfileResponse](#schemaprofile.profileresponse)|true|none|none|

<h2 id="tocScontractorrequest">ContractorRequest</h2>

<a id="schemacontractorrequest"></a>

```json
{
  "profile": {
    "ssn": "string",
    "externalId": "string",
    "firstName": "string",
    "lastName": "string",
    "phone": "string",
    "email": "string",
    "country": "string",
    "state": "string",
    "city": "string",
    "postalCode": "string",
    "address1": "string",
    "address2": "string",
    "dateOfBirth": "2019-02-09T08:01:37Z"
  }
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|profile|[profile.ProfileRequest](#schemaprofile.profilerequest)|true|none|none|

<h2 id="tocSpaginateddocumentresponse">PaginatedDocumentResponse</h2>

<a id="schemapaginateddocumentresponse"></a>

```json
{
  "items": [
    {
      "id": "string",
      "name": "string",
      "type": "string",
      "status": "string",
      "createdOn": "2019-02-09T08:01:37Z",
      "failureReason": "string"
    }
  ],
  "pagination": {
    "total": 0,
    "limit": 0,
    "page": 0,
    "pages": 0
  }
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|items|[[DocumentResponse](#schemadocumentresponse)]|true|none|none|
|pagination|[Pagination](#schemapagination)|true|none|none|

<h2 id="tocSmodels.fundingsourceverificationrequest">models.FundingSourceVerificationRequest</h2>

<a id="schemamodels.fundingsourceverificationrequest"></a>

```json
{
  "amount1": 0,
  "amount2": 0
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|amount1|number(double)|true|none|none|
|amount2|number(double)|true|none|none|

<h2 id="tocSmodels.fundingsourceresponse">models.FundingSourceResponse</h2>

<a id="schemamodels.fundingsourceresponse"></a>

```json
{
  "id": "string",
  "type": "string",
  "paymentsUri": "string",
  "profileId": "string",
  "isDefault": true,
  "status": "string",
  "name": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|id|string|true|none|none|
|type|string|true|none|none|
|paymentsUri|string|true|none|none|
|profileId|string|true|none|none|
|isDefault|boolean|true|none|none|
|status|string|true|none|none|
|name|string|true|none|none|

<h2 id="tocSmodels.fundingsourcerequest">models.FundingSourceRequest</h2>

<a id="schemamodels.fundingsourcerequest"></a>

```json
{
  "name": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|name|string|true|none|none|

<h2 id="tocSmodels.fundingsourceiavrequest">models.FundingSourceIavRequest</h2>

<a id="schemamodels.fundingsourceiavrequest"></a>

```json
{
  "uri": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|uri|string|true|none|none|

<h2 id="tocSmodels.fundingsourceiavtoken">models.FundingSourceIavToken</h2>

<a id="schemamodels.fundingsourceiavtoken"></a>

```json
{
  "token": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|token|string|true|none|none|

<h2 id="tocSbeneficialowneraddress">BeneficialOwnerAddress</h2>

<a id="schemabeneficialowneraddress"></a>

```json
{
  "address1": "string",
  "address2": "string",
  "city": "string",
  "stateProvinceRegion": "string",
  "postalCode": "string",
  "country": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|address1|string|true|none|none|
|address2|string|true|none|none|
|city|string|true|none|none|
|stateProvinceRegion|string|true|none|none|
|postalCode|string|true|none|none|
|country|string|true|none|none|

<h2 id="tocSmodels.beneficialownerresponse">models.BeneficialOwnerResponse</h2>

<a id="schemamodels.beneficialownerresponse"></a>

```json
{
  "id": "string",
  "verificationStatus": "string",
  "firstName": "string",
  "lastName": "string",
  "address": {
    "address1": "string",
    "address2": "string",
    "city": "string",
    "stateProvinceRegion": "string",
    "postalCode": "string",
    "country": "string"
  }
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|id|string|true|none|none|
|verificationStatus|string|true|none|none|
|firstName|string|true|none|none|
|lastName|string|true|none|none|
|address|[BeneficialOwnerAddress](#schemabeneficialowneraddress)|true|none|none|

<h2 id="tocSmodels.addbeneficialownerrequest">models.AddBeneficialOwnerRequest</h2>

<a id="schemamodels.addbeneficialownerrequest"></a>

```json
{
  "dateOfBirth": "string",
  "ssn": "string",
  "firstName": "string",
  "lastName": "string",
  "address": {
    "address1": "string",
    "address2": "string",
    "city": "string",
    "stateProvinceRegion": "string",
    "postalCode": "string",
    "country": "string"
  }
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|dateOfBirth|string|true|none|none|
|ssn|string|true|none|none|
|firstName|string|true|none|none|
|lastName|string|true|none|none|
|address|[BeneficialOwnerAddress](#schemabeneficialowneraddress)|true|none|none|

<h2 id="tocSmodels.retrybeneficialownerrequest">models.RetryBeneficialOwnerRequest</h2>

<a id="schemamodels.retrybeneficialownerrequest"></a>

```json
{
  "id": "string",
  "dateOfBirth": "string",
  "ssn": "string",
  "firstName": "string",
  "lastName": "string",
  "address": {
    "address1": "string",
    "address2": "string",
    "city": "string",
    "stateProvinceRegion": "string",
    "postalCode": "string",
    "country": "string"
  }
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|id|string|true|none|none|
|dateOfBirth|string|true|none|none|
|ssn|string|true|none|none|
|firstName|string|true|none|none|
|lastName|string|true|none|none|
|address|[BeneficialOwnerAddress](#schemabeneficialowneraddress)|true|none|none|

<h2 id="tocSmodels.editbeneficialownerresponse">models.EditBeneficialOwnerResponse</h2>

<a id="schemamodels.editbeneficialownerresponse"></a>

```json
{
  "dateOfBirth": "string",
  "ssn": "string",
  "firstName": "string",
  "lastName": "string",
  "address": {
    "address1": "string",
    "address2": "string",
    "city": "string",
    "stateProvinceRegion": "string",
    "postalCode": "string",
    "country": "string"
  }
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|dateOfBirth|string|true|none|none|
|ssn|string|true|none|none|
|firstName|string|true|none|none|
|lastName|string|true|none|none|
|address|[BeneficialOwnerAddress](#schemabeneficialowneraddress)|true|none|none|

<h2 id="tocSmodels.editbeneficialownerrequest">models.EditBeneficialOwnerRequest</h2>

<a id="schemamodels.editbeneficialownerrequest"></a>

```json
{
  "id": "string",
  "dateOfBirth": "string",
  "ssn": "string",
  "firstName": "string",
  "lastName": "string",
  "address": {
    "address1": "string",
    "address2": "string",
    "city": "string",
    "stateProvinceRegion": "string",
    "postalCode": "string",
    "country": "string"
  }
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|id|string|true|none|none|
|dateOfBirth|string|true|none|none|
|ssn|string|true|none|none|
|firstName|string|true|none|none|
|lastName|string|true|none|none|
|address|[BeneficialOwnerAddress](#schemabeneficialowneraddress)|true|none|none|

<h2 id="tocSbeneficialownerresponse">BeneficialOwnerResponse</h2>

<a id="schemabeneficialownerresponse"></a>

```json
{
  "id": "string",
  "verificationStatus": "string",
  "firstName": "string",
  "lastName": "string",
  "address": {
    "address1": "string",
    "address2": "string",
    "city": "string",
    "stateProvinceRegion": "string",
    "postalCode": "string",
    "country": "string"
  }
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|id|string|true|none|none|
|verificationStatus|string|true|none|none|
|firstName|string|true|none|none|
|lastName|string|true|none|none|
|address|[BeneficialOwnerAddress](#schemabeneficialowneraddress)|true|none|none|

<h2 id="tocSmodels.paginatedbeneficialownerresponse">models.PaginatedBeneficialOwnerResponse</h2>

<a id="schemamodels.paginatedbeneficialownerresponse"></a>

```json
{
  "items": [
    {
      "id": "string",
      "verificationStatus": "string",
      "firstName": "string",
      "lastName": "string",
      "address": {
        "address1": "string",
        "address2": "string",
        "city": "string",
        "stateProvinceRegion": "string",
        "postalCode": "string",
        "country": "string"
      }
    }
  ],
  "pagination": {
    "total": 0,
    "limit": 0,
    "page": 0,
    "pages": 0
  }
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|items|[[BeneficialOwnerResponse](#schemabeneficialownerresponse)]|true|none|none|
|pagination|[Pagination](#schemapagination)|true|none|none|

<h2 id="tocSmodels.tenantfundingsourceresponse">models.TenantFundingSourceResponse</h2>

<a id="schemamodels.tenantfundingsourceresponse"></a>

```json
{
  "name": "string",
  "status": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|name|string|true|none|none|
|status|string|true|none|none|

<h2 id="tocSmodels.createtenantfundingsourcerequest">models.CreateTenantFundingSourceRequest</h2>

<a id="schemamodels.createtenantfundingsourcerequest"></a>

```json
{
  "account": "string",
  "routing": "string",
  "bankAccountType": "string",
  "name": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|account|string|true|none|none|
|routing|string|true|none|none|
|bankAccountType|string|true|none|none|
|name|string|true|none|none|

<h2 id="tocSmodels.tenantfundingsourceverificationrequest">models.TenantFundingSourceVerificationRequest</h2>

<a id="schemamodels.tenantfundingsourceverificationrequest"></a>

```json
{
  "amount1": 0,
  "amount2": 0
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|amount1|number(double)|true|none|none|
|amount2|number(double)|true|none|none|

