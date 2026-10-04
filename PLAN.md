# Pocket Budget: plan

**Live:** https://pocket-budget1.netlify.app · **Code:** https://github.com/fayardzell/pocket-budget
**Status:** v1 shipped 2026-10-04. Next: use it for real for a few days.

Phase 1 "Pocket tool" project from the Builder's Roadmap.

## What it is
A phone-first budget tracker for **income and expenses**, in plain HTML/CSS/JavaScript.
Data is saved in the browser (localStorage). Deployed on Netlify from GitHub.

## Done when
- It's live at a public Netlify URL and works well on my phone.
- I've logged real income/expenses with it for at least a few days.

## Version 1 features
1. **Add form**: Income/Expense toggle, amount (required), category, date (defaults to today), note (optional).
2. **Entry list**: newest first, updates instantly when I add or delete.
3. **This month summary**: income, expenses, balance for the current month.
4. **Delete** an entry (with a confirm, so I don't lose things by accident).
5. **Saved** in localStorage, so entries survive closing the browser.

Categories (easy to change later):
- Income: Jobs, Other income
- Expense: Food, Gas, Supplies, Bills, Fun, Other

## Not in version 1 (ideas for later)
Edit entries · category breakdown · export/backup · month picker · install to home screen (PWA)

## Decisions
| Choice | Decision | Why |
|---|---|---|
| Tool | Budget tracker | Most real-life use |
| Money tracked | Income + expenses | See actual balance |
| Device | Phone first | Where I'll actually log stuff |
| Code layout | `index.html`, `style.css`, `app.js` | Structure / looks / behavior |
| Hosting | Netlify (via GitHub) | Same flow as the business site |
| Currency | US dollars | |

Known limit: localStorage data lives only on the device/browser it was entered in.

## Build steps (one small, working step at a time, with a git commit after each)
1. **Setup**: `git init`, the 3 empty files, page opens in the browser.
2. **Layout**: HTML for the summary, form, and list; mobile-first CSS. No behavior yet.
3. **Add entries**: JavaScript reads the form and shows entries in the list.
4. **Save/load**: localStorage, so a page refresh keeps everything.
5. **Monthly summary**: totals for the current month.
6. **Delete**: remove an entry, update list + totals + storage.
7. **Polish**: empty state, money formatting, check at phone width.
8. **Ship**: push to GitHub, connect Netlify, open the URL on my phone.

How we verify each step: open the page in the browser (at phone width), try the new feature, refresh to check it was saved.
