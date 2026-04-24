CREATE TABLE "classes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"color" text NOT NULL,
	"subject" text,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "classes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "coteachers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"class_id" uuid,
	"weekday" smallint,
	"hour" smallint,
	"teacher_name" text NOT NULL,
	"role" text
);
--> statement-breakpoint
CREATE TABLE "day_overrides" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" date NOT NULL,
	"hour" smallint,
	"kind" text NOT NULL,
	"class_id" uuid,
	"note" text
);
--> statement-breakpoint
CREATE TABLE "holidays" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" date NOT NULL,
	"label" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meetings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" date NOT NULL,
	"start_time" time,
	"end_time" time,
	"kind" text NOT NULL,
	"title" text NOT NULL,
	"class_id" uuid,
	"location" text,
	"mandatory" boolean DEFAULT true,
	"attended" boolean,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "weekly_slots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"weekday" smallint NOT NULL,
	"hour" smallint NOT NULL,
	"class_id" uuid,
	"room" text,
	"valid_from" date NOT NULL,
	"valid_to" date
);
--> statement-breakpoint
ALTER TABLE "coteachers" ADD CONSTRAINT "coteachers_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "day_overrides" ADD CONSTRAINT "day_overrides_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weekly_slots" ADD CONSTRAINT "weekly_slots_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;