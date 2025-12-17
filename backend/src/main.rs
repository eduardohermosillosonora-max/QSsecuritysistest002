use actix_web::{web, App, HttpServer, HttpResponse, Responder};
use actix_cors::Cors;
use pqcrypto_kyber::kyber1024;
use pqcrypto_dilithium::dilithium5;
use pqcrypto_traits::kem::{Ciphertext, PublicKey as KemPublicKey, SecretKey as KemSecretKey, SharedSecret};
use pqcrypto_traits::sign::{PublicKey as SignPublicKey, SecretKey as SignSecretKey, DetachedSignature};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;

// Estructuras para respuestas JSON
#[derive(Serialize)]
struct KeyPairResponse {
    public_key: String,
    message: String,
}

#[derive(Serialize)]
struct EncapsulateResponse {
    ciphertext: String,
    shared_secret: String,
}

#[derive(Deserialize)]
struct DecapsulateRequest {
    ciphertext: String,
}

// Estado global simulado (en memoria para demo)
struct AppState {
    kem_secret_key: Mutex<Option<kyber1024::SecretKey>>,
    sign_secret_key: Mutex<Option<dilithium5::SecretKey>>,
}

// --- HANDLERS ---

async fn status() -> impl Responder {
    HttpResponse::Ok().json(serde_json::json!({
        "status": "online",
        "system": "Quantum Hybrid Security System",
        "algorithms": ["Kyber-1024", "Dilithium-5"],
        "security_level": "NIST Level 5 (AES-256 equivalent)"
    }))
}

// Generar par de claves Kyber (KEM)
async fn generate_kem_keys(data: web::Data<AppState>) -> impl Responder {
    let (pk, sk) = kyber1024::keypair();
    
    // Guardar SK en memoria (simulación de HSM)
    let mut secret_store = data.kem_secret_key.lock().unwrap();
    *secret_store = Some(sk);

    HttpResponse::Ok().json(KeyPairResponse {
        public_key: hex::encode(pk.as_bytes()),
        message: "Kyber-1024 KeyPair Generated. Secret Key stored securely in memory.".to_string(),
    })
}

// Simular encapsulamiento (Cliente -> Servidor)
// En un caso real, esto lo haría el cliente con la PK del servidor.
// Aquí lo hacemos para demostrar el algoritmo.
async fn simulate_encapsulation(body: web::Json<String>) -> impl Responder {
    let pk_hex = body.into_inner();
    let pk_bytes = hex::decode(pk_hex).unwrap_or_default();
    
    if let Ok(pk) = kyber1024::PublicKey::from_bytes(&pk_bytes) {
        let (ss, ct) = kyber1024::encapsulate(&pk);
        HttpResponse::Ok().json(EncapsulateResponse {
            ciphertext: hex::encode(ct.as_bytes()),
            shared_secret: hex::encode(ss.as_bytes()),
        })
    } else {
        HttpResponse::BadRequest().body("Invalid Public Key")
    }
}

// Decapsular (Servidor recupera secreto compartido)
async fn decapsulate(body: web::Json<DecapsulateRequest>, data: web::Data<AppState>) -> impl Responder {
    let secret_store = data.kem_secret_key.lock().unwrap();
    
    if let Some(sk) = &*secret_store {
        let ct_bytes = hex::decode(&body.ciphertext).unwrap_or_default();
        if let Ok(ct) = kyber1024::Ciphertext::from_bytes(&ct_bytes) {
            let ss = kyber1024::decapsulate(&ct, sk);
            HttpResponse::Ok().json(serde_json::json!({
                "shared_secret": hex::encode(ss.as_bytes()),
                "status": "Success. Quantum-safe channel established."
            }))
        } else {
            HttpResponse::BadRequest().body("Invalid Ciphertext")
        }
    } else {
        HttpResponse::InternalServerError().body("No Secret Key available")
    }
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let app_state = web::Data::new(AppState {
        kem_secret_key: Mutex::new(None),
        sign_secret_key: Mutex::new(None),
    });

    println!("🚀 Quantum Security Server running on port 8080");

    HttpServer::new(move || {
        let cors = Cors::permissive(); // Para demo
        App::new()
            .wrap(cors)
            .app_data(app_state.clone())
            .route("/status", web::get().to(status))
            .route("/api/quantum/keys", web::post().to(generate_kem_keys))
            .route("/api/quantum/encapsulate", web::post().to(simulate_encapsulation))
            .route("/api/quantum/decapsulate", web::post().to(decapsulate))
    })
    .bind(("0.0.0.0", 8080))?
    .run()
    .await
}
