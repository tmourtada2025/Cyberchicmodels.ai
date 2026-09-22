-- models.lora_weights_url: fal LoRA weights URL, written at Stage 2 (engine brief §4).
-- Nullable; stays null until a LoRA is trained.

alter table public.models add column if not exists lora_weights_url text;
