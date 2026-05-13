CREATE TABLE "circolari_seen" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"source_key" text NOT NULL,
	"external_id" text NOT NULL,
	"titolo" text NOT NULL,
	"url" text NOT NULL,
	"pubblicata_il" timestamp with time zone,
	"notificata_il" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notification_log" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"dedupe_key" text NOT NULL,
	"sent_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"device_label" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"last_seen_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "push_subscriptions_endpoint_unique" UNIQUE("endpoint")
);
--> statement-breakpoint
CREATE TABLE "sources" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"label" text NOT NULL,
	"url" text NOT NULL,
	"kind" text NOT NULL,
	"selector" text,
	"keywords" text[],
	"active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "sources_key_unique" UNIQUE("key")
);
