FROM rust:1.75 as builder
WORKDIR /usr/src/app
COPY . .
# Instalar dependencias del sistema necesarias para compilar C (pqclean)
RUN apt-get update && apt-get install -y clang llvm
RUN cargo build --release

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y libssl-dev ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=builder /usr/src/app/target/release/backend /usr/local/bin/quantum-backend
CMD ["quantum-backend"]
