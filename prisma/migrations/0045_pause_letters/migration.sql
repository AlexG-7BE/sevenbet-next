-- Additive: the pause letters (Founder decisions, 13 October 2026;
-- docs/07_Decisions/PAUSE-LETTERS-2026-10-14.md). Nothing existing is changed or removed.
--
-- 1. The account keeps the last day of the pause a person named on /pause-plan
--    before signing up, and the register. Both are nullable; existing accounts
--    keep NULL. They time two letters and nothing else.
-- 2. PauseReminder holds an address left in the tool by a person without an
--    account, for three letters.
-- 3. The key/type rule of EmailTemplate learns the keys added by migration 0044.
-- 4. Swedish and Danish welcome and reminder letters, and the new letters in
--    Swedish, Danish and English.
CREATE TYPE "PauseRegister" AS ENUM ('SPELPAUS', 'ROFUS');

ALTER TABLE "User"
  ADD COLUMN "pauseEndsOn" DATE,
  ADD COLUMN "pauseRegister" "PauseRegister";

CREATE TABLE "PauseReminder" (
  "id" UUID NOT NULL,
  "environment" "AnalyticsEnvironment" NOT NULL,
  "email" VARCHAR(320) NOT NULL,
  "locale" VARCHAR(16) NOT NULL,
  "register" "PauseRegister" NOT NULL,
  "pauseEndsOn" DATE NOT NULL,
  "tokenHash" CHAR(64) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "confirmationSentAt" TIMESTAMP(3),
  "dayBeforeSentAt" TIMESTAMP(3),
  "overSentAt" TIMESTAMP(3),
  "unsubscribedAt" TIMESTAMP(3),
  "takenOverAt" TIMESTAMP(3),
  CONSTRAINT "PauseReminder_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PauseReminder_email_check" CHECK ("email" = lower(btrim("email")) AND position('@' in "email") > 1)
);

CREATE UNIQUE INDEX "PauseReminder_tokenHash_key" ON "PauseReminder"("tokenHash");
CREATE UNIQUE INDEX "PauseReminder_environment_email_key" ON "PauseReminder"("environment", "email");
CREATE INDEX "PauseReminder_environment_pauseEndsOn_idx" ON "PauseReminder"("environment", "pauseEndsOn");

COMMENT ON COLUMN "User"."pauseEndsOn" IS
  'Last day of the pause named on /pause-plan before sign-up. Times two letters only; never read for offers, rankings, routes or advertising.';
COMMENT ON TABLE "PauseReminder" IS
  'Addresses left in the /pause-plan tool by people without an account, for three letters timed by the pause end. No other use.';

ALTER TABLE "EmailTemplate" DROP CONSTRAINT "EmailTemplate_key_type_check";
ALTER TABLE "EmailTemplate" ADD CONSTRAINT "EmailTemplate_key_type_check" CHECK (
  ("key" IN ('EMAIL_VERIFICATION', 'PASSWORD_RESET', 'ACCOUNT_SECURITY') AND "type" = 'TRANSACTIONAL')
  OR ("key" IN (
    'WELCOME', 'PROGRAMME_REMINDER', 'PROGRAMME_DAY_3', 'PROGRAMME_DAY_7', 'PROGRAMME_DAY_10',
    'PAUSE_ENDS_TOMORROW', 'PAUSE_OVER', 'PAUSE_TOOL_CONFIRMATION'
  ) AND "type" = 'LIFECYCLE')
  OR ("key" = 'MARKETING_BROADCAST' AND "type" = 'MARKETING')
);

INSERT INTO "EmailTemplate" (
  "id", "key", "type", "locale", "subject", "htmlBody", "textBody",
  "version", "active", "createdBy", "updatedBy", "updatedAt"
) VALUES
  ('4a910045-89d2-4aad-a045-000000000001', 'WELCOME', 'LIFECYCLE', 'sv',
   'Välkommen till B4GAMBLE',
   '<p>Hej {{name}},</p><p>Ditt konto är klart. Dina tio steg väntar, och du fortsätter där du slutade när du vill. Det är gratis och privat.</p><p><a href="{{programme_url}}">Fortsätt till dina tio steg</a></p><p>Ditt spel. Dina regler.</p>',
   E'Hej {{name}},\n\nDitt konto är klart. Dina tio steg väntar, och du fortsätter där du slutade när du vill. Det är gratis och privat.\n\nFortsätt till dina tio steg: {{programme_url}}\n\nDitt spel. Dina regler.',
   1, true, 'migration-0045', 'migration-0045', CURRENT_TIMESTAMP),
  ('4a910045-89d2-4aad-a045-000000000002', 'WELCOME', 'LIFECYCLE', 'da',
   'Velkommen til B4GAMBLE',
   '<p>Hej {{name}},</p><p>Din konto er klar. Dine ti trin venter, og du fortsætter, hvor du slap, når du vil. Det er gratis og privat.</p><p><a href="{{programme_url}}">Fortsæt til dine ti trin</a></p><p>Dit spil. Dine regler.</p>',
   E'Hej {{name}},\n\nDin konto er klar. Dine ti trin venter, og du fortsætter, hvor du slap, når du vil. Det er gratis og privat.\n\nFortsæt til dine ti trin: {{programme_url}}\n\nDit spil. Dine regler.',
   1, true, 'migration-0045', 'migration-0045', CURRENT_TIMESTAMP),
  ('4a910045-89d2-4aad-a045-000000000003', 'PROGRAMME_REMINDER', 'LIFECYCLE', 'sv',
   'Dina tio steg väntar',
   '<p>Hej {{name}},</p><p>Ditt sparade program finns kvar. Du fortsätter där du slutade, när du vill.</p><p><a href="{{programme_url}}">Fortsätt programmet</a></p><p><a href="{{unsubscribe_url}}">Avsluta de här mejlen</a></p>',
   E'Hej {{name}},\n\nDitt sparade program finns kvar. Du fortsätter där du slutade, när du vill.\n\nFortsätt programmet: {{programme_url}}\n\nAvsluta de här mejlen: {{unsubscribe_url}}',
   1, true, 'migration-0045', 'migration-0045', CURRENT_TIMESTAMP),
  ('4a910045-89d2-4aad-a045-000000000004', 'PROGRAMME_REMINDER', 'LIFECYCLE', 'da',
   'Dine ti trin venter',
   '<p>Hej {{name}},</p><p>Dit gemte program ligger klar. Du fortsætter, hvor du slap, når du vil.</p><p><a href="{{programme_url}}">Fortsæt programmet</a></p><p><a href="{{unsubscribe_url}}">Afmeld disse mails</a></p>',
   E'Hej {{name}},\n\nDit gemte program ligger klar. Du fortsætter, hvor du slap, når du vil.\n\nFortsæt programmet: {{programme_url}}\n\nAfmeld disse mails: {{unsubscribe_url}}',
   1, true, 'migration-0045', 'migration-0045', CURRENT_TIMESTAMP),
  ('4a910045-89d2-4aad-a045-000000000005', 'PROGRAMME_DAY_3', 'LIFECYCLE', 'sv',
   'Dag 3: suget kommer i vågor',
   '<p>Hej {{name}},</p><p>Suget kommer ofta i vågor, och en våg går över. Skriv ner kedjan nästa gång den kommer: situationen, tanken, det du gör. Tre rader räcker.</p><p>Steget om suget tar fem till femton minuter.</p><p><a href="{{programme_url}}">Fortsätt där du slutade</a></p><p><a href="{{plan_url}}">Planen dag för dag: 10 dagar. 10 steg.</a></p><p>Ditt spel. Dina regler.</p><p><a href="{{unsubscribe_url}}">Avsluta de här mejlen</a></p>',
   E'Hej {{name}},\n\nSuget kommer ofta i vågor, och en våg går över. Skriv ner kedjan nästa gång den kommer: situationen, tanken, det du gör. Tre rader räcker.\n\nSteget om suget tar fem till femton minuter.\n\nFortsätt där du slutade: {{programme_url}}\n\nPlanen dag för dag: 10 dagar. 10 steg.: {{plan_url}}\n\nDitt spel. Dina regler.\n\nAvsluta de här mejlen: {{unsubscribe_url}}',
   1, true, 'migration-0045', 'migration-0045', CURRENT_TIMESTAMP),
  ('4a910045-89d2-4aad-a045-000000000006', 'PROGRAMME_DAY_3', 'LIFECYCLE', 'da',
   'Dag 3: trangen kommer i bølger',
   '<p>Hej {{name}},</p><p>Trangen kommer ofte i bølger, og en bølge går over igen. Skriv kæden ned, næste gang den kommer: situationen, tanken, det du gør. Tre linjer er nok.</p><p>Trinnet om trangen tager fem til femten minutter.</p><p><a href="{{programme_url}}">Fortsæt, hvor du slap</a></p><p><a href="{{plan_url}}">Planen dag for dag: Dagen efter ROFUS. 10 trin.</a></p><p>Dit spil. Dine regler.</p><p><a href="{{unsubscribe_url}}">Afmeld disse mails</a></p>',
   E'Hej {{name}},\n\nTrangen kommer ofte i bølger, og en bølge går over igen. Skriv kæden ned, næste gang den kommer: situationen, tanken, det du gør. Tre linjer er nok.\n\nTrinnet om trangen tager fem til femten minutter.\n\nFortsæt, hvor du slap: {{programme_url}}\n\nPlanen dag for dag: Dagen efter ROFUS. 10 trin.: {{plan_url}}\n\nDit spil. Dine regler.\n\nAfmeld disse mails: {{unsubscribe_url}}',
   1, true, 'migration-0045', 'migration-0045', CURRENT_TIMESTAMP),
  ('4a910045-89d2-4aad-a045-000000000007', 'PROGRAMME_DAY_3', 'LIFECYCLE', 'en',
   'Day 3: the urge comes in waves',
   '<p>Hello {{name}},</p><p>The urge often comes in waves, and a wave passes. Next time it comes, write the chain down: the situation, the thought, what you do. Three lines are enough.</p><p>The step about the urge takes five to fifteen minutes.</p><p><a href="{{programme_url}}">Continue where you left off</a></p><p><a href="{{plan_url}}">The plan day by day</a></p><p>You don''t have to quit. You have to be in control.</p><p><a href="{{unsubscribe_url}}">Unsubscribe from these emails</a></p>',
   E'Hello {{name}},\n\nThe urge often comes in waves, and a wave passes. Next time it comes, write the chain down: the situation, the thought, what you do. Three lines are enough.\n\nThe step about the urge takes five to fifteen minutes.\n\nContinue where you left off: {{programme_url}}\n\nThe plan day by day: {{plan_url}}\n\nYou don''t have to quit. You have to be in control.\n\nUnsubscribe from these emails: {{unsubscribe_url}}',
   1, true, 'migration-0045', 'migration-0045', CURRENT_TIMESTAMP),
  ('4a910045-89d2-4aad-a045-000000000008', 'PROGRAMME_DAY_7', 'LIFECYCLE', 'sv',
   'Dag 7: en person som vet den riktiga siffran',
   '<p>Hej {{name}},</p><p>Välj en människa som får veta den riktiga siffran: hur mycket och hur ofta. En räcker. Du behöver inte förklara allt, bara säga siffran.</p><p>Steget om stöd hjälper dig att välja vem, och vad du säger.</p><p><a href="{{programme_url}}">Fortsätt där du slutade</a></p><p><a href="{{plan_url}}">Planen dag för dag: 10 dagar. 10 steg.</a></p><p>Ditt spel. Dina regler.</p><p><a href="{{unsubscribe_url}}">Avsluta de här mejlen</a></p>',
   E'Hej {{name}},\n\nVälj en människa som får veta den riktiga siffran: hur mycket och hur ofta. En räcker. Du behöver inte förklara allt, bara säga siffran.\n\nSteget om stöd hjälper dig att välja vem, och vad du säger.\n\nFortsätt där du slutade: {{programme_url}}\n\nPlanen dag för dag: 10 dagar. 10 steg.: {{plan_url}}\n\nDitt spel. Dina regler.\n\nAvsluta de här mejlen: {{unsubscribe_url}}',
   1, true, 'migration-0045', 'migration-0045', CURRENT_TIMESTAMP),
  ('4a910045-89d2-4aad-a045-000000000009', 'PROGRAMME_DAY_7', 'LIFECYCLE', 'da',
   'Dag 7: ét menneske, der kender det rigtige tal',
   '<p>Hej {{name}},</p><p>Vælg ét menneske, der får det rigtige tal at vide: hvor meget og hvor tit. Én er nok. Du behøver ikke forklare det hele, bare sige tallet.</p><p>Trinnet om støtte hjælper dig med at vælge hvem, og hvad du siger.</p><p><a href="{{programme_url}}">Fortsæt, hvor du slap</a></p><p><a href="{{plan_url}}">Planen dag for dag: Dagen efter ROFUS. 10 trin.</a></p><p>Dit spil. Dine regler.</p><p><a href="{{unsubscribe_url}}">Afmeld disse mails</a></p>',
   E'Hej {{name}},\n\nVælg ét menneske, der får det rigtige tal at vide: hvor meget og hvor tit. Én er nok. Du behøver ikke forklare det hele, bare sige tallet.\n\nTrinnet om støtte hjælper dig med at vælge hvem, og hvad du siger.\n\nFortsæt, hvor du slap: {{programme_url}}\n\nPlanen dag for dag: Dagen efter ROFUS. 10 trin.: {{plan_url}}\n\nDit spil. Dine regler.\n\nAfmeld disse mails: {{unsubscribe_url}}',
   1, true, 'migration-0045', 'migration-0045', CURRENT_TIMESTAMP),
  ('4a910045-89d2-4aad-a045-000000000010', 'PROGRAMME_DAY_7', 'LIFECYCLE', 'en',
   'Day 7: one person who knows the real number',
   '<p>Hello {{name}},</p><p>Choose one person who gets to know the real number: how much and how often. One is enough. You don''t have to explain everything, only say the number.</p><p>The step about support helps you choose who, and what to say.</p><p><a href="{{programme_url}}">Continue where you left off</a></p><p><a href="{{plan_url}}">The plan day by day</a></p><p>You don''t have to quit. You have to be in control.</p><p><a href="{{unsubscribe_url}}">Unsubscribe from these emails</a></p>',
   E'Hello {{name}},\n\nChoose one person who gets to know the real number: how much and how often. One is enough. You don''t have to explain everything, only say the number.\n\nThe step about support helps you choose who, and what to say.\n\nContinue where you left off: {{programme_url}}\n\nThe plan day by day: {{plan_url}}\n\nYou don''t have to quit. You have to be in control.\n\nUnsubscribe from these emails: {{unsubscribe_url}}',
   1, true, 'migration-0045', 'migration-0045', CURRENT_TIMESTAMP),
  ('4a910045-89d2-4aad-a045-000000000011', 'PROGRAMME_DAY_10', 'LIFECYCLE', 'sv',
   'Dag 10: summan och tiden före appen',
   '<p>Hej {{name}},</p><p>Bestäm två saker innan appen är öppen: summan och tiden. En siffra, inte en känsla. Skriv dem på en rad som du kan läsa igen.</p><p>Du behöver inte sluta. Du behöver ha kontrollen.</p><p><a href="{{programme_url}}">Fortsätt där du slutade</a></p><p><a href="{{plan_url}}">Planen dag för dag: 10 dagar. 10 steg.</a></p><p>Ditt spel. Dina regler.</p><p><a href="{{unsubscribe_url}}">Avsluta de här mejlen</a></p>',
   E'Hej {{name}},\n\nBestäm två saker innan appen är öppen: summan och tiden. En siffra, inte en känsla. Skriv dem på en rad som du kan läsa igen.\n\nDu behöver inte sluta. Du behöver ha kontrollen.\n\nFortsätt där du slutade: {{programme_url}}\n\nPlanen dag för dag: 10 dagar. 10 steg.: {{plan_url}}\n\nDitt spel. Dina regler.\n\nAvsluta de här mejlen: {{unsubscribe_url}}',
   1, true, 'migration-0045', 'migration-0045', CURRENT_TIMESTAMP),
  ('4a910045-89d2-4aad-a045-000000000012', 'PROGRAMME_DAY_10', 'LIFECYCLE', 'da',
   'Dag 10: beløbet og tiden før appen',
   '<p>Hej {{name}},</p><p>Bestem to ting, før appen er åben: beløbet og tiden. Et tal, ikke en følelse. Skriv dem på én linje, som du kan læse igen.</p><p>Du behøver ikke stoppe. Du skal bevare kontrollen.</p><p><a href="{{programme_url}}">Fortsæt, hvor du slap</a></p><p><a href="{{plan_url}}">Planen dag for dag: Dagen efter ROFUS. 10 trin.</a></p><p>Dit spil. Dine regler.</p><p><a href="{{unsubscribe_url}}">Afmeld disse mails</a></p>',
   E'Hej {{name}},\n\nBestem to ting, før appen er åben: beløbet og tiden. Et tal, ikke en følelse. Skriv dem på én linje, som du kan læse igen.\n\nDu behøver ikke stoppe. Du skal bevare kontrollen.\n\nFortsæt, hvor du slap: {{programme_url}}\n\nPlanen dag for dag: Dagen efter ROFUS. 10 trin.: {{plan_url}}\n\nDit spil. Dine regler.\n\nAfmeld disse mails: {{unsubscribe_url}}',
   1, true, 'migration-0045', 'migration-0045', CURRENT_TIMESTAMP),
  ('4a910045-89d2-4aad-a045-000000000013', 'PROGRAMME_DAY_10', 'LIFECYCLE', 'en',
   'Day 10: the amount and the time before the app',
   '<p>Hello {{name}},</p><p>Decide two things before the app is open: the amount and the time. A number, not a feeling. Write them on one line you can read again.</p><p>You don''t have to quit. You have to be in control.</p><p><a href="{{programme_url}}">Continue where you left off</a></p><p><a href="{{plan_url}}">The plan day by day</a></p><p><a href="{{unsubscribe_url}}">Unsubscribe from these emails</a></p>',
   E'Hello {{name}},\n\nDecide two things before the app is open: the amount and the time. A number, not a feeling. Write them on one line you can read again.\n\nYou don''t have to quit. You have to be in control.\n\nContinue where you left off: {{programme_url}}\n\nThe plan day by day: {{plan_url}}\n\nUnsubscribe from these emails: {{unsubscribe_url}}',
   1, true, 'migration-0045', 'migration-0045', CURRENT_TIMESTAMP),
  ('4a910045-89d2-4aad-a045-000000000014', 'PAUSE_ENDS_TOMORROW', 'LIFECYCLE', 'sv',
   'I morgon tar din paus slut',
   '<p>Hej,</p><p>I morgon tar din paus slut. Summan och tiden bestämmer du i dag.</p><p>Skriv tre rader: summan före appen, tiden före appen och en person som vet.</p><p><a href="{{plan_url}}">Öppna planen</a></p><p><a href="{{programme_url}}">Börja steg 1 i det gratis programmet</a></p><p>Vill du prata med någon: Stödlinjen, 020-81 91 00. Gratis och anonymt.</p><p>Ditt spel. Dina regler.</p><p><a href="{{unsubscribe_url}}">Avsluta de här mejlen</a></p>',
   E'Hej,\n\nI morgon tar din paus slut. Summan och tiden bestämmer du i dag.\n\nSkriv tre rader: summan före appen, tiden före appen och en person som vet.\n\nÖppna planen: {{plan_url}}\n\nBörja steg 1 i det gratis programmet: {{programme_url}}\n\nVill du prata med någon: Stödlinjen, 020-81 91 00. Gratis och anonymt.\n\nDitt spel. Dina regler.\n\nAvsluta de här mejlen: {{unsubscribe_url}}',
   1, true, 'migration-0045', 'migration-0045', CURRENT_TIMESTAMP),
  ('4a910045-89d2-4aad-a045-000000000015', 'PAUSE_ENDS_TOMORROW', 'LIFECYCLE', 'da',
   'I morgen udløber din pause',
   '<p>Hej,</p><p>I morgen udløber din pause. Beløbet og tiden bestemmer du i dag.</p><p>Skriv tre linjer: beløbet før appen, tiden før appen og ét menneske, der ved det.</p><p><a href="{{plan_url}}">Åbn planen</a></p><p><a href="{{programme_url}}">Start trin 1 i det gratis program</a></p><p>Vil du tale med nogen: StopSpillet, 70 22 28 25. Gratis og fortroligt.</p><p>Dit spil. Dine regler.</p><p><a href="{{unsubscribe_url}}">Afmeld disse mails</a></p>',
   E'Hej,\n\nI morgen udløber din pause. Beløbet og tiden bestemmer du i dag.\n\nSkriv tre linjer: beløbet før appen, tiden før appen og ét menneske, der ved det.\n\nÅbn planen: {{plan_url}}\n\nStart trin 1 i det gratis program: {{programme_url}}\n\nVil du tale med nogen: StopSpillet, 70 22 28 25. Gratis og fortroligt.\n\nDit spil. Dine regler.\n\nAfmeld disse mails: {{unsubscribe_url}}',
   1, true, 'migration-0045', 'migration-0045', CURRENT_TIMESTAMP),
  ('4a910045-89d2-4aad-a045-000000000016', 'PAUSE_ENDS_TOMORROW', 'LIFECYCLE', 'en',
   'Your pause ends tomorrow',
   '<p>Hello,</p><p>Your pause ends tomorrow. The amount and the time are yours to decide today.</p><p>Write three lines: the amount before the app, the time before the app, and one person who knows.</p><p><a href="{{plan_url}}">Open the plan</a></p><p><a href="{{programme_url}}">Start step 1 of the free Programme</a></p><p>If you want to talk to someone: Stödlinjen in Sweden, 020-81 91 00; StopSpillet in Denmark, 70 22 28 25.</p><p>You don''t have to quit. You have to be in control.</p><p><a href="{{unsubscribe_url}}">Unsubscribe from these emails</a></p>',
   E'Hello,\n\nYour pause ends tomorrow. The amount and the time are yours to decide today.\n\nWrite three lines: the amount before the app, the time before the app, and one person who knows.\n\nOpen the plan: {{plan_url}}\n\nStart step 1 of the free Programme: {{programme_url}}\n\nIf you want to talk to someone: Stödlinjen in Sweden, 020-81 91 00; StopSpillet in Denmark, 70 22 28 25.\n\nYou don''t have to quit. You have to be in control.\n\nUnsubscribe from these emails: {{unsubscribe_url}}',
   1, true, 'migration-0045', 'migration-0045', CURRENT_TIMESTAMP),
  ('4a910045-89d2-4aad-a045-000000000017', 'PAUSE_OVER', 'LIFECYCLE', 'sv',
   'I dag tar din paus slut. Dina regler gäller.',
   '<p>Hej,</p><p>I dag tar din paus slut. Dina regler gäller: summan före appen, tiden före appen och en person som vet.</p><p>Har du inte skrivit dem än tar det några minuter.</p><p><a href="{{plan_url}}">Öppna planen</a></p><p><a href="{{programme_url}}">Börja steg 1 i det gratis programmet</a></p><p>Vill du prata med någon: Stödlinjen, 020-81 91 00. Gratis och anonymt.</p><p>Ditt spel. Dina regler.</p><p><a href="{{unsubscribe_url}}">Avsluta de här mejlen</a></p>',
   E'Hej,\n\nI dag tar din paus slut. Dina regler gäller: summan före appen, tiden före appen och en person som vet.\n\nHar du inte skrivit dem än tar det några minuter.\n\nÖppna planen: {{plan_url}}\n\nBörja steg 1 i det gratis programmet: {{programme_url}}\n\nVill du prata med någon: Stödlinjen, 020-81 91 00. Gratis och anonymt.\n\nDitt spel. Dina regler.\n\nAvsluta de här mejlen: {{unsubscribe_url}}',
   1, true, 'migration-0045', 'migration-0045', CURRENT_TIMESTAMP),
  ('4a910045-89d2-4aad-a045-000000000018', 'PAUSE_OVER', 'LIFECYCLE', 'da',
   'I dag udløber din pause. Dine regler gælder.',
   '<p>Hej,</p><p>I dag udløber din pause. Dine regler gælder: beløbet før appen, tiden før appen og ét menneske, der ved det.</p><p>Har du ikke skrevet dem endnu, tager det et par minutter.</p><p><a href="{{plan_url}}">Åbn planen</a></p><p><a href="{{programme_url}}">Start trin 1 i det gratis program</a></p><p>Vil du tale med nogen: StopSpillet, 70 22 28 25. Gratis og fortroligt.</p><p>Dit spil. Dine regler.</p><p><a href="{{unsubscribe_url}}">Afmeld disse mails</a></p>',
   E'Hej,\n\nI dag udløber din pause. Dine regler gælder: beløbet før appen, tiden før appen og ét menneske, der ved det.\n\nHar du ikke skrevet dem endnu, tager det et par minutter.\n\nÅbn planen: {{plan_url}}\n\nStart trin 1 i det gratis program: {{programme_url}}\n\nVil du tale med nogen: StopSpillet, 70 22 28 25. Gratis og fortroligt.\n\nDit spil. Dine regler.\n\nAfmeld disse mails: {{unsubscribe_url}}',
   1, true, 'migration-0045', 'migration-0045', CURRENT_TIMESTAMP),
  ('4a910045-89d2-4aad-a045-000000000019', 'PAUSE_OVER', 'LIFECYCLE', 'en',
   'Your pause ends today. Your rules apply.',
   '<p>Hello,</p><p>Your pause ends today. Your rules apply: the amount before the app, the time before the app, and one person who knows.</p><p>If you have not written them yet, it takes a few minutes.</p><p><a href="{{plan_url}}">Open the plan</a></p><p><a href="{{programme_url}}">Start step 1 of the free Programme</a></p><p>If you want to talk to someone: Stödlinjen in Sweden, 020-81 91 00; StopSpillet in Denmark, 70 22 28 25.</p><p>You don''t have to quit. You have to be in control.</p><p><a href="{{unsubscribe_url}}">Unsubscribe from these emails</a></p>',
   E'Hello,\n\nYour pause ends today. Your rules apply: the amount before the app, the time before the app, and one person who knows.\n\nIf you have not written them yet, it takes a few minutes.\n\nOpen the plan: {{plan_url}}\n\nStart step 1 of the free Programme: {{programme_url}}\n\nIf you want to talk to someone: Stödlinjen in Sweden, 020-81 91 00; StopSpillet in Denmark, 70 22 28 25.\n\nYou don''t have to quit. You have to be in control.\n\nUnsubscribe from these emails: {{unsubscribe_url}}',
   1, true, 'migration-0045', 'migration-0045', CURRENT_TIMESTAMP),
  ('4a910045-89d2-4aad-a045-000000000020', 'PAUSE_TOOL_CONFIRMATION', 'LIFECYCLE', 'sv',
   'Din paus: vi hörs dagen innan den tar slut',
   '<p>Hej,</p><p>Vi hörs den {{pause_date}}. Här är planen under tiden.</p><p><a href="{{plan_url}}">10 dagar. 10 steg.</a></p><p>Vi skriver två gånger till: dagen innan din paus tar slut och dagen då den är slut. Sedan inget mer.</p><p><a href="{{unsubscribe_url}}">Avsluta de här mejlen</a></p>',
   E'Hej,\n\nVi hörs den {{pause_date}}. Här är planen under tiden.\n\n10 dagar. 10 steg.: {{plan_url}}\n\nVi skriver två gånger till: dagen innan din paus tar slut och dagen då den är slut. Sedan inget mer.\n\nAvsluta de här mejlen: {{unsubscribe_url}}',
   1, true, 'migration-0045', 'migration-0045', CURRENT_TIMESTAMP),
  ('4a910045-89d2-4aad-a045-000000000021', 'PAUSE_TOOL_CONFIRMATION', 'LIFECYCLE', 'da',
   'Din pause: vi skriver dagen før, den udløber',
   '<p>Hej,</p><p>Vi skriver igen den {{pause_date}}. Her er planen i mellemtiden.</p><p><a href="{{plan_url}}">Dagen efter ROFUS. 10 trin.</a></p><p>Vi skriver to gange mere: dagen før, din pause udløber, og dagen, hvor den er slut. Derefter ikke mere.</p><p><a href="{{unsubscribe_url}}">Afmeld disse mails</a></p>',
   E'Hej,\n\nVi skriver igen den {{pause_date}}. Her er planen i mellemtiden.\n\nDagen efter ROFUS. 10 trin.: {{plan_url}}\n\nVi skriver to gange mere: dagen før, din pause udløber, og dagen, hvor den er slut. Derefter ikke mere.\n\nAfmeld disse mails: {{unsubscribe_url}}',
   1, true, 'migration-0045', 'migration-0045', CURRENT_TIMESTAMP),
  ('4a910045-89d2-4aad-a045-000000000022', 'PAUSE_TOOL_CONFIRMATION', 'LIFECYCLE', 'en',
   'Your pause: we write the day before it ends',
   '<p>Hello,</p><p>We will write again on {{pause_date}}. Here is the plan in the meantime.</p><p><a href="{{plan_url}}">The plan for the day after your pause</a></p><p>We write twice more: the day before your pause ends and the day it is over. Then nothing more.</p><p><a href="{{unsubscribe_url}}">Unsubscribe from these emails</a></p>',
   E'Hello,\n\nWe will write again on {{pause_date}}. Here is the plan in the meantime.\n\nThe plan for the day after your pause: {{plan_url}}\n\nWe write twice more: the day before your pause ends and the day it is over. Then nothing more.\n\nUnsubscribe from these emails: {{unsubscribe_url}}',
   1, true, 'migration-0045', 'migration-0045', CURRENT_TIMESTAMP)
ON CONFLICT ("key", "locale", "version") DO NOTHING;
