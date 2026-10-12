# One sign-in form, and a shorter start

**Status:** ACCEPTED. Parts 1 to 6 are implemented.

**Decision authority:** explicit Founder instructions, 11 October 2026.

- On the goal: "я хочу сделать этап регистрации ещё проще чем сейчас".
- On the pieces: "на экране истории готовые ответы в 1 тап мне тоже нравятся. и мне нравится строка «продолжая, вы подтверждаете 18+ и принимаете terms и privacy». регистрация через google или email… тоже мне нравится. ну и надо в log in тоже сделать, что бы всё и там работало."
- On email: "просто попросить человека задать пароль сразу, так как будто бы привычнее, и человек сразу попадает в личный кабинет", then the choice "Email и пароль, без активации".
- On consent: the choice "Кнопка после ответа", then "вот так лучше всего — и под списком появится одна кнопка «Agree and continue» без отдельного второго экрана".
- On several answers: "человек может выбрать не только 1 вариант, у него же могут быть вообще все эти вещи".
- On voice and free text: "может быть вообще стоит убрать возможность человеку рассказать свою историю голосом?… не размывает ли эта функция фокус на том, что нам нужно в первую очередь, что бы человек зарегистрировался", then the choice "Только готовые ответы" (no voice, no own text; a sixth answer "Something else").
- On the email opt-in and the side door, after seeing the screens: "поставь галочку на email рассылки сразу, если человек захочет пускай сам уберет её, и сделай описание к этой галочке короче… и убери её вниз! и что за Tell my story first? мы же начинаем с этого, как человек дошел до регистрации не сделав этого?"
- On the consent wording and the screen after the answers: "а можно ли сделать формулировку… короче? и зачем нам your starting point in your words — если он просто пересказывает то, что выбрал человек на 1 шаге? может оставить там только what we will work first? при этом переименовав это на что-то вроде — вот что мы сможем с вами сделать? и сделать это тоже большим заголовком".
- On the password: "куда ты убрал password который был ниже поля для email? он должен ввести email а затем пароль, и нажать на кнопку continue with email".
- On the unused voice code: "а мы можем не удалять эту часть кода, а просто вынести её за скобки из проекта пока, что бы потом легко вернуть в случае необходимости? но так, что бы она не мешала", then the choice "Метка в истории" (out of the working project, kept under a named tag).
- After using the live start: "во первых, почему так долго теперь открывается? во вторых когда человек выбирает something else — наверное надо в этом поле дать ему что-то вписать? в третьих… когда он нажимает на log in и пытается зарегистрироваться там… мы должны просто его зарегистрировать без старта, или как?", then the choices "Сразу к готовым ответам" and "Да, короткое поле".
- On the wait after a press on Google or email: the choice "Записывать заранее".
- On Log in sending him back to the Programme screen: "почему при нажатии на гугл регистрацию меня отправляет вот сюда? даже если я уже ответил там… на вопросы."
- On older rules: "я тот кто эти правила устанавливает. если есть разногласия просто пришли мне их для решения".

**Supersedes in part:** [PROGRAMME-FAST-START-2026-09-25](PROGRAMME-FAST-START-2026-09-25.md) "three required checks on the access screen" (now a line and one consent button) and its quiet account-first route (removed from the Programme). [EMAIL-REACHABILITY-AT-SIGNUP-2026-09-27](EMAIL-REACHABILITY-AT-SIGNUP-2026-09-27.md) "one unticked checkbox" (now ticked by default, short, last in the form). RFC-022, RFC-023 and RFC-056 for Mission 01 input: typed and voice input are no longer offered; the provider, retention and kill-switch boundaries of those RFCs stand for the text request that remains. RFC-029 and the Google readiness record "standalone login is returning-user-only" (Log in now creates accounts). Everything else in those records stands.

## Why

Before this decision a new person passed four screens before an account existed: three required ticks, a story of at least 20 characters, a wait, then Google or an email form hidden behind "Use email instead" with a separate "create / sign in" switch. Production request logs for 4–10 October 2026 show five people passing the ticks and none sending a story; the earlier baseline for 27 September – 10 October was 8 starts, 4 Starting Points and 0 sign-ups. The log search may be incomplete, and the numbers are small; they do not contradict the Founder's reading that the start is too long.

"Log in" was a dead end for a new person: Google there signed in existing accounts only and showed an error to everyone else, and the page said there was no sign-up form.

## Decision

### Part 1 — one form in three places (implemented)

The same two actions sit on the Programme save step, on the account-first screen and on `/login`: **Continue with Google**, then **email and password** with one button, "Continue with email".

- **No separate "sign up" and "log in".** The email button creates the account, or signs in to the account that already owns the email. A wrong password for an existing email reads "Email or password is incorrect."; on the Programme screen a "Forgot password?" link then appears.
- **Email, then password, then the button, all visible at once**, on the Programme save step and on `/login`. The first build hid the password on the Programme screens until a character was typed; the Founder asked for it back under the email field the same day.
- **No activation.** The account works at once and the person lands in their plan. The confirmation link still goes out in the background, as decided on 27 September 2026; a confirmed address gates only marketing mail and later Google linking.
- **A line replaces two ticks.** "By continuing, you confirm you are 18+ and accept the Terms and Privacy Notice." stands under the Enter button on the Programme access screen and under the form on `/login`, with links to both documents. Continuing is the affirmation. It is asked where a person first meets it and is not repeated on the save step.
- **The access screen keeps one check** until Part 2: the explicit consent to process the story. Its heading is "One check before you begin."
- **Log in creates accounts.** A new person who continues with Google or email on `/login` gets an account and opens their plan with "Start Mission 01". The email opt-in is offered there too.
- **A Starting Point made in the same tab is not lost.** If a person with an unsaved Starting Point opens `/login`, it goes with the account from there (Part 6). The first build sent that person back to the Programme save step to press the same button again; the Founder rejected it the same day.

What the server records is unchanged: the same three affirmed facts (`adultConfirmed`, `termsAccepted`, `privacyAcknowledged`) with the Terms and Privacy versions, the same signed proof before any account is created, and the same acceptance row for the account. No table, column or enum changed.

How Log in stays inside the existing server rules:

- Email sign-up on `/login` first asks the access endpoint for the signed proof (the affirmation the line states) and sends it with the sign-up request, exactly as the Programme does.
- Google on `/login` uses the Programme callback pair, the only one the server lets create an account, and hands the Programme page an account-first return. The Programme page then records the affirmation for the account and opens the plan. The server rule "a `/login` callback cannot create a social account" is untouched.

### Part 2 — ready answers and one consent button (implemented)

The Programme start is one screen, for a first visit and for an account that starts Mission 01 from its plan:

- **Ready answers** under "What feels hardest right now?": "I chase my losses", "I spend more than I plan", "I can't stop once I start", "I gamble when I'm stressed", "I hide it from people close to me" and "Something else". **Several can be picked.**
- **No voice and no free text.** The microphone, the text field and their screen are gone from the client. "Something else" is the way forward when none of the five fits; that person's Starting Point is general.
- **One button under the list, "Agree and continue"**, directly under the consent statement. Pressing it is the explicit consent to process the picked answers (special-category data) and, on a first visit, under the same line as in Part 1, the 18+ / Terms / Privacy affirmation. There is no consent tick and no separate consent screen. The button is unavailable until an answer is picked.
- **The consent statement is short and names what is processed now:** "I agree that B4GAMBLE and its AI provider use my answers, which may reveal my health, to personalise my plan." It keeps the three things an explicit consent must say: what (the answers, which may reveal health), who (B4GAMBLE and its AI provider) and why (to personalise the plan). Typing, speech and the transcription provider left the statement, so it has a new version, `article-9-authority:2026-10-11:v2`. Consents recorded under v1 stay in the database as history; a person who starts Mission 01 again agrees to v2.
- **The screen after the answers shows one thing:** the first thing the Programme will work on, under the large heading "Here's what we can do together." It no longer repeats the picked answers back as "Your Starting Point, in your words"; the Starting Point is still saved to the account and shown in the plan. The Google button reads "Continue with Google".
- **What Mission 01 receives** is the question and the picked answers, in the person's language and in list order, exactly as they read them ("What feels hardest right now? I chase my losses. I spend more than I plan."). Nothing the person did not see is added. The Starting Point is built from it as before; the order stays answer → result → save.
- **No side door.** The quiet "Create an account first" link of 25 September and its "Tell my story first" way back are removed: inside the Programme a person reaches registration only through the answers. A new person who wants an account first uses Log in.
- **An account that has not affirmed access yet** opens its plan with one button, "Open my plan", under the line. It is not asked for the story consent there.

The server is unchanged apart from the consent version: the Mission 01 request, its validation, the claim, rewards and the support-first route work as before. The picked answers arrive as text input.

### The email opt-in is ticked, short and last (implemented with Part 2)

- The box reads "Email me B4GAMBLE updates", is ticked when the form opens and is the last thing in the form, on the Programme save step and on Log in. A person who does not want the emails unticks it.
- The wording and the default are policy version `email-marketing-v2`; consent events record it, so subscriptions made with a pre-ticked box can be told apart from the `v1` ones a person ticked.
- A sign-in never overwrites an earlier choice: on a Google return the account's recorded preference is read first, and a person who is already subscribed, unsubscribed or suppressed is left as they are. Email sign-in to an existing account records nothing.
- **Stated to the Founder before building:** in Great Britain and the EU a box ticked in advance does not count as consent to marketing email (UK GDPR and PECR, GDPR and the ePrivacy rules), so campaign mail sent on the strength of it can be challenged. The Founder decided to proceed. Unsubscribe links and the suppression list work as before.

### Part 3 — the voice code leaves the working project and stays under a tag (implemented)

The client stopped reaching the transcription routes in Part 2. The Founder asked that the code be set aside so that it does not get in the way and can be brought back, and chose a named tag in history over an archive folder or a switched-off copy.

**Kept:** the annotated tag `archive/programme-voice-2026-10-11` on commit `53ee0da0`, the last commit on `main` where voice worked end to end: the microphone and composer screen, both routes, the realtime and file adapters, their tests and all thirteen translations.

**Removed from the working project:**

- the routes `POST /api/program/program-ai/transcription` and `POST /api/program/program-ai/transcription/realtime`, the transcription service, the realtime adapter and browser client, the voice draft helper, the upload limits and the bounded multipart reader;
- the audio adapter and port in `openai-adapters.ts` and `ports.ts`, the two transcription models in `runtime-config.ts`, the provider codes `TRANSCRIPTION_FAILED` and `INPUT_TOO_LARGE`, the transcription language of each Programme route, and the rate-limit buckets `PROGRAMME_TRANSCRIPTION_SESSION` and `PROGRAMME_TRANSCRIPTION_IP`;
- the Programme-only `Permissions-Policy: microphone=(self)`. Every page, the Programme included, now sends the one deny-all policy. Crossing between public pages and the Programme still loaded a fresh document at that point; entering the Programme stopped doing so the same day ([PROGRAMME-ENTRY-WITHOUT-RELOAD-2026-10-11](PROGRAMME-ENTRY-WITHOUT-RELOAD-2026-10-11.md));
- `voice` as a Mission 01 input mode: the turn route accepts `inputMode: "text"` and refuses anything else;
- voice wording in the Privacy Notice, the Terms and the FAQ answer "Do I need an account to start?" (thirteen languages). Both documents show "Updated 11 October 2026"; the Terms and Privacy versions recorded at acceptance are unchanged, as they were for the 10 October notice update;
- 77 Programme catalogue rows that no screen uses (the microphone and composer texts, the two- and three-check headings, "Enter Mission 01", "Use email instead", the account-first links and other rows left behind by earlier screens). The catalogue has 624 keys; the language QA report was regenerated;
- tests that covered only this code, and the removed test file in the npm script lists.

**Unchanged:** the text turn (`/api/program/program-ai/turn`), consent, claim, rewards and the support-first route. No table, column, enum or constraint changed: the rate-limit table's scope check still lists the two voice buckets and nothing writes them. `PROGRAM_AI_TRANSCRIPTION_MODEL` and `PROGRAM_AI_REALTIME_TRANSCRIPTION_MODEL` are no longer read; a hosting environment that still has them keeps working. On 11 October 2026 Production still had the first and did not have the second. The Founder ordered it deleted the same day ("удали… что бы не мешала"); it was removed from Production and from two Preview entries bound to branches that no longer exist, and no transcription variable remains in hosting.

**RFC-056** stays `ACTIVE` for Fast text generation; its voice sections are retired. RFC-023's voice transport and voice-privacy rules have no runtime.

**Bringing voice back.** Everything is at the tag.

1. Restore the deleted files as they were: `git checkout archive/programme-voice-2026-10-11 -- app/api/program/program-ai/transcription lib/programme/application/programme-ai-transcription.service.ts lib/programme/program-ai/openai-realtime-transcription.ts lib/programme/program-ai/realtime-transcription-client.ts lib/programme/program-ai/voice-draft.ts lib/programme/program-ai/transcription-limits.ts lib/programme/program-ai/transcription-request.ts tests/program-ai-transcription-request.test.ts tests/programme-voice-draft.test.ts`.
2. Bring back the removed parts of the edited files with `git diff main archive/programme-voice-2026-10-11 -- <file>`: `openai-adapters.ts`, `ports.ts`, `runtime-config.ts`, `provider-errors.ts`, `contracts.ts`, `validation.ts`, `lib/programme/presentation.ts`, `lib/programme/rate-limit.ts`, `lib/programme/mutation-access.ts`, `next.config.mjs`, `.env.example` and the catalogue rows.
3. The screen is the larger job: the microphone and composer were replaced by the ready-answers start, so `ProgramAiExperience.tsx` and `ProgramAiFinalPresentation.tsx` at the tag are a reference to rebuild from, not files to copy over.
4. Before release: a new consent statement version that names speech and the transcription provider again, the Privacy Notice and Terms wording, and the voice sections of RFC-056.

### Part 4 — the next screen opens at once; a note for "Something else"; a new account opens on the answers (implemented)

Changed after the Founder used the live start. This part amends three statements of Part 2: the next screen no longer waits for the server, "Something else" has a short note, and the screen after the answers shows lines of ours instead of the server's focus text.

**Why.** In production the press on "Agree and continue" took about four seconds before the next screen: the access record, the Programme session, the consent record and the answers went to the server one after another, and the screen waited for all four. In the request checked (11 October, 14:25 UTC) the AI provider refused the answers for its rate limit, so the text shown after the wait was the general fallback.

- **The next screen opens at once.** The press shows "Here's what we can do together." before any request is sent. The same four requests then run behind the screen, in the same order: the consent is still recorded before the answers are sent, and a failed consent record stops there.
- **The screen shows lines of ours, one per picked answer** ("Set a stop point before you play, so a loss ends the session instead of starting a chase." for "I chase my losses", and so on, in every Programme language). It therefore does not depend on the AI provider. The Starting Point the server builds from the answers is still what is saved to the account and shown in the plan.
- **Registration waits for the server, not the screen.** Every registration action (Google, email, saving to an account) first waits for the Starting Point; it is normally there before a person has typed an email. If the work behind the screen failed, the screen says so and the same press sends the answers again; no account is created before the server has answered.
- **Support first is unchanged in effect.** If the server answers "support first", its screen replaces the form and nothing is registered. The form can be visible for the moment before that answer arrives; no registration action can complete in that moment. The production provider adapter returns "continue" for every request today.
- **"Something else" opens one short optional note** (up to 280 characters, no microphone), shown only while that answer is picked. It is part of the answers: it is sent with them as "Something else: …", under the same consent statement, and nowhere else. The Privacy Notice already names "what you pick or type".
- **A new account opens on the answers, not on an empty plan.** After sign-up on Log in, and for any account that has not answered yet, the Programme page shows the answers, without the 18+ line (the account already affirmed it) and with a quiet link "Open my plan". The picked answers are saved to the plan without another press; the plan opens when the save is done, and "Save to my account" stays as the way to try again. An account that has answered opens on its plan, as before. "Start Mission 01" in the plan opens the answers at once.

Not changed: what the server stores. The Starting Point is saved once, when an account redeems the claim (RFC-022).

### Part 5 — the claim is made behind the screen (implemented)

**Why.** A press on "Continue with Google" or "Continue with email" first told the server that the Starting Point was ready and asked it for the pending claim, and only then started Google or created the account. In the production request checked (11 October, 14:25 UTC) those two requests took about three seconds between the press and the Google request.

- **Both requests now follow the answers, behind the screen.** When the server has answered "continue", the client marks the Starting Point ready and asks for the claim at once. A press then starts Google or creates the account without those two requests.
- **Nothing personal is stored earlier.** The server keeps the confirmed Starting Point in the browser session (`confirmedContentStorage: "browser_session"`); these two requests change the anonymous session's state and create a claim token that lasts 30 minutes. The Starting Point itself is still saved once, when an account redeems the claim. A person who never registers leaves a ready mark and an expired token, which the existing runtime purge removes with the session.
- **A claim made earlier is used only while fresh.** The server keeps it for 30 minutes. An email press reuses a claim made up to 20 minutes ago; a Google press, which leaves the page first, reuses one made up to 5 minutes ago, so at least 25 minutes remain to come back. Otherwise the press makes the claim again, as it always did.
- **A lapsed or reset claim is made again.** If redeeming an earlier claim fails, the client makes a new one and redeems once more. "Save to my account" always makes a new one.
- **Not after support first.** The server refuses to mark a Starting Point ready while its support-first state stands; the claim is then made by the press, after "Continue when I'm ready".
- **Both Mission 01 actions count as complete once the claim is made**, so the anonymous XP preview on the server reads 40 from that moment instead of from the press. Rewards are still created only when the claim is redeemed.

This was first put to the Founder as a change to an RFC-022 rule. On reading the server it is not one: RFC-022 fixes when the Starting Point is saved (once, at the claim's redemption), not when the claim is created. The earlier timing was the client's own, pinned by one browser test.

**Extended on 12 October 2026** by [PROGRAMME-INSTANT-GOOGLE-PRESS-2026-10-12](PROGRAMME-INSTANT-GOOGLE-PRESS-2026-10-12.md): a claim made by a press is remembered as well, the claim is renewed behind the screen while the Google button is on it, and the Google address is prepared there too.

### Part 6 — Log in carries what the tab already holds (implemented)

**Why.** Part 1 sent a person who had already answered back from `/login` to the Programme save step, where the same Google or email button had to be pressed a second time. The Founder met it on production and rejected it.

- **A Starting Point made in the tab goes with the account from Log in.** A press on Google makes the pending claim there (or reuses one made up to 5 minutes ago), marks the journey and starts Google at once; the Programme page redeems the claim on return. Email signs in or creates the account first, then does the same and opens the Programme page, which redeems the claim. Nothing is pressed twice and the answers are not asked again.
- **If the claim cannot be made, signing in still goes ahead** and the picked answers travel with it.
- **Answers without a Starting Point are shown picked.** If the answers were sent but the Starting Point never arrived, the new account opens on the answers with those answers already picked; one press on "Agree and continue" is left, because the consent is given by that button.
- **Support first carries nothing.** It holds registration back, so Log in treats that tab as empty.
- While a Google sign-up that began on Log in is being finished, the Programme page shows its loading screen instead of a form with nothing to press.

The server is unchanged. `/login` uses the same two claim requests as the Programme screen (`makePendingClaim`).

## Not chosen

- **Voice out, with a quiet text field kept** on the start screen. The Founder chose ready answers only, to keep the first screen on one thing.
- **Email with one field and no password** (an emailed code or link for returning people). The Founder preferred the familiar password. A code would also have needed a new kind of email, which is a database change.
- **Required activation by email.** A person would leave for their inbox before reaching the plan, and from an in-app browser the link opens elsewhere, where the Starting Point is not.
- **"Email first" inside social-app browsers.** The Founder tested Google sign-up inside Instagram and it works. Emulating in-app browsers could not show Google's embedded-browser block either way.
- **Registration as the first screen.** The save step gives a reason to create an account; the quiet account-first route covers people who want one first.

## Evidence

- `tests/account-entry.test.ts` (in `auth-comms:test`): one request for a new email on the Programme and for a returning person on Log in, sign-in through the same button, the wrong-password answer in both orders, no fall-through after a refused creation, the full affirmation body and proof reuse, the account-first Google hand-over, and the Log in wiring.
- `tests/ready-answers.test.ts` (in `programme:test`): six answers, the text Mission 01 receives, and every single answer in every Programme language passing the server's Mission 01 check.
- Part 6: `tests/account-entry.test.ts` (what the tab holds; the two claim requests and their access evidence; the mark for the Programme page; a refused claim leaves the answers; neither Log in action moves to the Programme before signing in) and the browser specs (answers, then Log in with real email auth: one press, the plan with the Starting Point; Google from Log in with the Starting Point carried, run only where Google is configured; answers shown picked after sign-in).
- Part 5: `tests/ready-answers.test.ts` (the freshness windows against the server's 30 minutes), `tests/program-ai-structural.test.ts` (the claim follows the answers and only "continue"; reused only while fresh; made again if redeeming fails) and `tests/program-ai-browser.spec.ts` (the claim exists before any press; a claim reset on the server is made again and the account is still created with its Starting Point).
- Part 4: `tests/ready-answers.test.ts` (the note is tidied, bounded and sent only with "Something else"; every answer has a translated line of ours), `tests/program-ai-structural.test.ts` (the press awaits nothing; the consent is recorded before the answers are sent; every registration action waits for the Starting Point and support first suppresses it; an account without answers opens on them), and `tests/program-ai-browser.spec.ts` (with the answers held back for three seconds the next screen is there within 1.5 seconds; sign-up on Log in, the answers, the note and the plan with real email auth).
- `tests/gb-legal-p0-closure.test.ts` and `tests/program-ai-structural.test.ts`: the consent statement once and directly above its button, no tick, the consent recorded before any answer is sent, the v2 consent version, the unchanged affirmation sent to the server, and no voice or free-text input in the client.
- Part 3: `tests/program-ai-structural.test.ts` (no voice route, adapter, bucket, permission or setting remains; the turn route stays), `tests/programme-internationalisation.test.ts` (one deny-all Permissions-Policy rule; `inputMode: "voice"` refused), `tests/program-ai-openai-adapters.test.ts` (leftover voice variables in hosting do not break the provider configuration), `tests/legal-programme-privacy.test.ts` (no voice wording in the Privacy Notice or the Terms), and in the browser `tests/program-ai-browser.spec.ts` (both retired routes answer 404), `tests/programme-document-policy-boundary-browser.spec.ts` and `tests/programme-internationalisation-browser.spec.ts` (every Programme route denies the microphone).
- `tests/auth-comms-browser.spec.ts`, `tests/program-ai-browser.spec.ts`, `tests/programme-internationalisation-browser.spec.ts`, `tests/final-production-readiness-browser.spec.ts`, `tests/founder-mobile-production-browser.spec.ts`: the start screen, picked answers through real email auth, the account-first route, support-first and every Programme language.
