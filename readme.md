## To run the frontend application
1. Navigate to the `static` directory:
   ```bash
   cd static
   python -m http.server 8000
   ```
2. Open your web browser and go to `http://localhost:8000`.

## To run the backend application
### Prerequisites
- ensure that you have pipenv installed. If not, you can install it using:
  ```bash
  sudo apt install pipenv
  ```
- Then install the required packages:
  ```bash
  pipenv install
  ```
1. Navigate to the `api` directory:
   ```bash
   cd api
   pipenv run start
   ```
2. The backend will be running on `http://localhost:5000`.