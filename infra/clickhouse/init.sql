CREATE DATABASE IF NOT EXISTS zynex;

CREATE TABLE IF NOT EXISTS zynex.inference_metrics
(
  timestamp DateTime,
  request_id String,
  conversation_id String,
  provider LowCardinality(String),
  model LowCardinality(String),
  latency_ms UInt32,
  time_to_first_token_ms UInt32,
  prompt_tokens UInt32,
  completion_tokens UInt32,
  status LowCardinality(String),
  error_code Nullable(String)
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (timestamp, provider, model);
