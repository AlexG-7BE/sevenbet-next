# One sign-in form, and a shorter start

**Status:** ACCEPTED. Parts 1 and 2 are implemented. Part 3 (removing the unused server voice code) is approved and not built yet.

**Decision authority:** explicit Founder instructions, 11 October 2026.

- On the goal: "я хочу сделать этап регистрации ещё проще чем сейчас".
- On the pieces: "на экране истории готовые ответы в 1 тап мне тоже нравятся. и мне нравится строка «продолжая, вы подтверждаете 18+ и принимаете terms и privacy». регистрация через google или email… тоже мне нравится. ну и надо в log in тоже сделать, что бы всё и там работало."
- On email: "просто попросить человека задать пароль сразу, так как будто бы привычнее, и человек сразу попадает в личный кабинет", then the choice "Email и пароль, без активации".
- On consent: the choice "Кнопка после ответа", then "вот так лучше всего — и под списком появится одна кнопка «Agree and continue» без отдельного второго экрана".
- On several answers: "человек может выбрать не только 1 вариант, у него же могут быть вообще все эти вещи".
- On voice and free text: "может быть вообще стоит убрать возможность человеку рассказать свою историю голосом?… не размывает ли эта функция фокус на том, что нам нужно в первую очередь, что бы человек зарегистрировался", then the choice "Только готовые ответы" (no voice, no own text; a sixth answer "Something else").
- On older rules: "я тот кто эти правила устанавливает. если есть разногласия просто пришли мне их для решения".

**Supersedes in part:** [PROGRAMME-FAST-START-2026-09-25](PROGRAMME-FAST-START-2026-09-25.md) "three required checks on the access screen" (now a line and one consent button). RFC-022, RFC-023 and RFC-056 for Mission 01 input: typed and voice input are no longer offered; the provider, retention and kill-switch boundaries of those RFCs stand for the text request that remains. RFC-029 and the Google readiness record "standalone login is returning-user-only" (Log in now creates accounts). Everything else in those records stands.

## Why

Before this decision a new person passed four screens before an account existed: three required ticks, a story of at least 20 characters, a wait, then Google or an email form hidden behind "Use email instead" with a separate "create / sign in" switch. Production request logs for 4–10 October 2026 show five people passing the ticks and none sending a story; the earlier baseline for 27 September – 10 October was 8 starts, 4 Starting Points and 0 sign-ups. The log search may be incomplete, and the numbers are small; they do not contradict the Founder's reading that the start is too long.

"Log in" was a dead end for a new person: Google there signed in existing accounts only and showed an error to everyone else, and the page said there was no sign-up form.

## Decision

### Part 1 — one form in three places (implemented)

The same two actions sit on the Programme save step, on the account-first screen and on `/login`: **Continue with Google**, then **email and password** with one button, "Continue with email".

- **No separate "sign up" and "log in".** The email button creates the account, or signs in to the account that already owns the email. A wrong password for an existing email reads "Email or password is incorrect."; on the Programme screen a "Forgot password?" link then appears.
- **The password field arrives with the first typed character** on the Programme screens, so the form reads as one field until it is used. `/login` shows both fields at once, because a browser can only fill a saved password into a field that exists.
- **No activation.** The account works at once and the person lands in their plan. The confirmation link still goes out in the background, as decided on 27 September 2026; a confirmed address gates only marketing mail and later Google linking.
- **A line replaces two ticks.** "By continuing, you confirm you are 18+ and accept the Terms and Privacy Notice." stands under the Enter button on the Programme access screen and under the form on `/login`, with links to both documents. Continuing is the affirmation. It is asked where a person first meets it and is not repeated on the save step.
- **The access screen keeps one check** until Part 2: the explicit consent to process the story. Its heading is "One check before you begin."
- **Log in creates accounts.** A new person who continues with Google or email on `/login` gets an account and opens their plan with "Start Mission 01". The optional email opt-in is offered there too.
- **A Starting Point made in the same tab is not lost.** If a person with an unsaved Starting Point opens `/login`, either action sends them back to the Programme save step, which carries the same form and the claim that saving needs.

What the server records is unchanged: the same three affirmed facts (`adultConfirmed`, `termsAccepted`, `privacyAcknowledged`) with the Terms and Privacy versions, the same signed proof before any account is created, and the same acceptance row for the account. No table, column or enum changed.

How Log in stays inside the existing server rules:

- Email sign-up on `/login` first asks the access endpoint for the signed proof (the affirmation the line states) and sends it with the sign-up request, exactly as the Programme does.
- Google on `/login` uses the Programme callback pair, the only one the server lets create an account, and hands the Programme page an account-first return. The Programme page then records the affirmation for the account and opens the plan. The server rule "a `/login` callback cannot create a social account" is untouched.

### Part 2 — ready answers and one consent button (implemented)

The Programme start is one screen, for a first visit and for an account that starts Mission 01 from its plan:

- **Ready answers** under "What feels hardest right now?": "I chase my losses", "I spend more than I plan", "I can't stop once I start", "I gamble when I'm stressed", "I hide it from people close to me" and "Something else". **Several can be picked.**
- **No voice and no free text.** The microphone, the text field and their screen are gone from the client. "Something else" is the way forward when none of the five fits; that person's Starting Point is general.
- **One button under the list, "Agree and continue"**, directly under the consent statement. Pressing it is the explicit consent to process the picked answers (special-category data) and, on a first visit, under the same line as in Part 1, the 18+ / Terms / Privacy affirmation. There is no consent tick and no separate consent screen. The button is unavailable until an answer is picked.
- **The consent statement names what is processed now:** "I explicitly consent to B4GAMBLE processing the answers I choose, including information that may reveal my health, and sending them to its AI provider to personalise my Programme." Typing, speech and the transcription provider left the statement, so it has a new version, `article-9-authority:2026-10-11:v2`. Consents recorded under v1 stay in the database as history; a person who starts Mission 01 again agrees to v2.
- **What Mission 01 receives** is the question and the picked answers, in the person's language and in list order, exactly as they read them ("What feels hardest right now? I chase my losses. I spend more than I plan."). Nothing the person did not see is added. The Starting Point is built from it as before; the order stays answer → result → save.
- **The quiet "Create an account first" link** is on the start screen. Registering first records only the 18+ / Terms / Privacy affirmation; the story consent waits for the answers.
- **An account that has not affirmed access yet** opens its plan with one button, "Open my plan", under the line. It is not asked for the story consent there.

The server is unchanged apart from the consent version: the Mission 01 request, its validation, the claim, rewards and the support-first route work as before. The picked answers arrive as text input.

### Part 3 — remove the unused voice code (approved, not built)

The client no longer reaches the transcription routes. A follow-up change removes them, the realtime adapter and client, the voice draft helper, the microphone permission on Programme pages and the voice wording in the Privacy Notice, and records the lifecycle of RFC-056.

## Not chosen

- **Voice out, with a quiet text field kept** on the start screen. The Founder chose ready answers only, to keep the first screen on one thing.
- **Email with one field and no password** (an emailed code or link for returning people). The Founder preferred the familiar password. A code would also have needed a new kind of email, which is a database change.
- **Required activation by email.** A person would leave for their inbox before reaching the plan, and from an in-app browser the link opens elsewhere, where the Starting Point is not.
- **"Email first" inside social-app browsers.** The Founder tested Google sign-up inside Instagram and it works. Emulating in-app browsers could not show Google's embedded-browser block either way.
- **Registration as the first screen.** The save step gives a reason to create an account; the quiet account-first route covers people who want one first.

## Evidence

- `tests/account-entry.test.ts` (in `auth-comms:test`): one request for a new email on the Programme and for a returning person on Log in, sign-in through the same button, the wrong-password answer in both orders, no fall-through after a refused creation, the full affirmation body and proof reuse, the account-first Google hand-over, and the Log in wiring.
- `tests/ready-answers.test.ts` (in `programme:test`): six answers, the text Mission 01 receives, and every single answer in every Programme language passing the server's Mission 01 check.
- `tests/gb-legal-p0-closure.test.ts` and `tests/program-ai-structural.test.ts`: the consent statement once and directly above its button, no tick, the consent recorded before any answer is sent, the v2 consent version, the unchanged affirmation sent to the server, and no voice or free-text input in the client.
- `tests/auth-comms-browser.spec.ts`, `tests/program-ai-browser.spec.ts`, `tests/programme-internationalisation-browser.spec.ts`, `tests/final-production-readiness-browser.spec.ts`, `tests/founder-mobile-production-browser.spec.ts`: the start screen, picked answers through real email auth, the account-first route, support-first and every Programme language.
