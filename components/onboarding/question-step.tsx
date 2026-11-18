"use client"

// The 8 question screens (mockups 03–10). Answers go to the draft at once
// (sessionStorage), so back, refresh and "Continue" never lose anything.

import { useId } from "react"
import Link from "next/link"
import { STEPS, isStepDone, nextStep, previousStep, type Step } from "@/lib/onboarding/answers"
import type { ActivityLevel, Goal, Sex, TrainingType, Units, WorkoutsPerWeek } from "@/lib/onboarding/types"
import {
  AGE_YEARS,
  goalWeightScale,
  heightScale,
  shortWeight,
  splitFeet,
  weightNumber,
  weightScale,
  weightUnit,
  type Scale,
} from "@/lib/onboarding/units"
import {
  BoltIcon,
  DashIcon,
  DownIcon,
  DumbbellIcon,
  EqualIcon,
  FemaleIcon,
  HomeIcon,
  MaleIcon,
  RunIcon,
  SitIcon,
  StandIcon,
  WalkIcon,
} from "./icons"
import {
  Chips,
  OptionRow,
  Options,
  PILL_PRIMARY,
  QuestionScreen,
  Ruler,
  Segmented,
  StepButton,
  Switch,
  ValueStepper,
  Wheel,
} from "./onboarding-ui"
import { useDraft } from "./use-draft"

export const GOAL_TEXT: Record<Goal, { title: string; sub: string; lower: string }> = {
  LOSE: { title: "Lose weight", sub: "Eat a little less than you burn", lower: "lose weight" },
  MAINTAIN: { title: "Maintain weight", sub: "Keep your weight steady", lower: "maintain weight" },
  BUILD: { title: "Build muscle", sub: "Eat a little more and train", lower: "build muscle" },
}

export const ACTIVITY_TEXT: Record<ActivityLevel, { title: string; sub: string; lower: string }> = {
  SEDENTARY: { title: "Mostly sitting", sub: "Desk job, little walking", lower: "mostly sitting" },
  LIGHT: { title: "Lightly active", sub: "On my feet some of the day", lower: "lightly active" },
  ACTIVE: { title: "Active", sub: "On my feet most of the day", lower: "active" },
  VERY_ACTIVE: { title: "Very active", sub: "Physical job", lower: "very active" },
}

export const WORKOUTS_TEXT: Record<WorkoutsPerWeek, { chip: string; phrase: string }> = {
  W0: { chip: "0", phrase: "no workouts" },
  W1_2: { chip: "1–2", phrase: "1–2 workouts a week" },
  W3_4: { chip: "3–4", phrase: "3–4 workouts a week" },
  W5_PLUS: { chip: "5+", phrase: "5 or more workouts a week" },
}

const GOAL_ICONS: Record<Goal, React.ReactNode> = { LOSE: <DownIcon />, MAINTAIN: <EqualIcon />, BUILD: <DumbbellIcon /> }
const ACTIVITY_ICONS: Record<ActivityLevel, React.ReactNode> = {
  SEDENTARY: <SitIcon />,
  LIGHT: <WalkIcon />,
  ACTIVE: <StandIcon />,
  VERY_ACTIVE: <BoltIcon />,
}

const href = (step: Step | null) => (step ? `/start/${step}` : "/start/plan")

export function QuestionStep({ step }: { step: Step }) {
  const { draft, update } = useDraft()
  const titleId = useId()
  const number = STEPS.indexOf(step) + 1
  const prev = previousStep(step)
  const done = isStepDone(step, draft)
  const last = step === "units"

  const continueButton = done ? (
    <Link href={href(nextStep(step))} className={PILL_PRIMARY}>
      {last ? "Create my plan" : "Continue"}
    </Link>
  ) : (
    <button type="button" className={PILL_PRIMARY} disabled>
      {last ? "Create my plan" : "Continue"}
    </button>
  )

  const screen = (title: string, subtitle: string, children: React.ReactNode) => (
    <QuestionScreen
      step={number}
      back={prev ? `/start/${prev}` : "/welcome"}
      title={title}
      subtitle={subtitle}
      titleId={titleId}
      footer={continueButton}
    >
      {children}
    </QuestionScreen>
  )

  switch (step) {
    case "goal":
      return screen(
        "What is your goal?",
        "We use it to set your daily calories. You can change it later.",
        <Options labelledBy={titleId}>
          {(["LOSE", "MAINTAIN", "BUILD"] as Goal[]).map((goal) => (
            <OptionRow
              key={goal}
              icon={GOAL_ICONS[goal]}
              title={GOAL_TEXT[goal].title}
              sub={GOAL_TEXT[goal].sub}
              selected={draft.goal === goal}
              onSelect={() => update({ goal })}
            />
          ))}
        </Options>
      )

    case "sex":
      return screen(
        "What is your sex?",
        "Only used in the calorie formula. Nobody else sees it.",
        <Options labelledBy={titleId}>
          {(
            [
              ["MALE", <MaleIcon key="m" />, "Male", undefined],
              ["FEMALE", <FemaleIcon key="f" />, "Female", undefined],
              ["UNSPECIFIED", <DashIcon key="u" />, "Prefer not to say", "We use the average of both formulas"],
            ] as [Sex, React.ReactNode, string, string | undefined][]
          ).map(([sex, icon, title, sub]) => (
            <OptionRow key={sex} icon={icon} title={title} sub={sub} selected={draft.sex === sex} onSelect={() => update({ sex })} />
          ))}
        </Options>
      )

    case "age":
      return screen(
        "How old are you?",
        "Your age changes how much energy your body uses at rest.",
        <Wheel
          value={draft.ageYears}
          min={AGE_YEARS.min}
          max={AGE_YEARS.max}
          unit="years"
          label="Age"
          onChange={(ageYears) => update({ ageYears })}
        />
      )

    case "height":
      return screen("How tall are you?", "Drag the ruler or tap − and +.", <HeightPicker />)

    case "weight":
      return screen("What do you weigh now?", "A rough number is fine. You will log your weight as you go.", <WeightPicker />)

    case "activity":
      return screen(
        "How active are you?",
        "Outside of your workouts, on a normal day.",
        <>
          <Options labelledBy={titleId} className="mt-5 gap-2">
            {(Object.keys(ACTIVITY_TEXT) as ActivityLevel[]).map((level) => (
              <OptionRow
                key={level}
                icon={ACTIVITY_ICONS[level]}
                title={ACTIVITY_TEXT[level].title}
                sub={ACTIVITY_TEXT[level].sub}
                selected={draft.activityLevel === level}
                onSelect={() => update({ activityLevel: level })}
              />
            ))}
          </Options>
          <Chips
            label="Workouts per week"
            options={(Object.keys(WORKOUTS_TEXT) as WorkoutsPerWeek[]).map((value) => ({
              value,
              label: WORKOUTS_TEXT[value].chip,
            }))}
            value={draft.workoutsPerWeek}
            onChange={(workoutsPerWeek) => update({ workoutsPerWeek })}
          />
        </>
      )

    case "training":
      return screen(
        "How do you train?",
        "Choose all that apply. Pulse shows the right logging for each.",
        <Options labelledBy={titleId} multi>
          {(
            [
              ["GYM", <DumbbellIcon key="g" />, "Gym", "Sets × reps × kg"],
              ["HOME", <HomeIcon key="h" />, "Home", "Bodyweight: reps or time"],
              ["CARDIO", <RunIcon key="c" />, "Cardio", "Duration and distance"],
            ] as [TrainingType, React.ReactNode, string, string][]
          ).map(([type, icon, title, sub]) => {
            const selected = draft.trainingTypes.includes(type)
            return (
              <OptionRow
                key={type}
                multi
                icon={icon}
                title={title}
                sub={sub}
                selected={selected}
                onSelect={() =>
                  update({
                    trainingTypes: selected
                      ? draft.trainingTypes.filter((t) => t !== type)
                      : [...draft.trainingTypes, type],
                  })
                }
              />
            )
          })}
        </Options>
      )

    case "units":
      return screen(
        "Which units do you use?",
        "For the whole app. You can switch any time in Settings.",
        <Options labelledBy={titleId}>
          {(
            [
              ["METRIC", "Metric", "kg · cm · km"],
              ["IMPERIAL", "Imperial", "lb · ft and in · mi"],
            ] as [Units, string, string][]
          ).map(([units, title, sub]) => (
            <OptionRow key={units} title={title} sub={sub} selected={draft.units === units} onSelect={() => update({ units })} />
          ))}
        </Options>
      )
  }
}

/** Apply a typed number if it is inside the scale; returns whether it was. */
function applyTyped(text: string, scale: Scale, toTick: (n: number) => number, set: (metric: number) => void): boolean {
  const n = Number(text)
  if (!text.trim() || !Number.isFinite(n)) return false
  const tick = toTick(n)
  if (tick < scale.min || tick > scale.max) return false
  set(scale.toMetric(tick))
  return true
}

function HeightPicker() {
  const { draft, update } = useDraft()
  const scale = heightScale(draft.units)
  const tick = Math.min(scale.max, Math.max(scale.min, scale.toTick(draft.heightCm)))
  const set = (t: number) => update({ heightCm: scale.toMetric(Math.min(scale.max, Math.max(scale.min, t))) })
  const imperial = draft.units === "IMPERIAL"
  const { ft, in: inch } = splitFeet(tick)

  return (
    <>
      <Segmented
        label="Height unit"
        options={[
          { value: "METRIC", label: "cm" },
          { value: "IMPERIAL", label: "ft · in" },
        ]}
        value={draft.units}
        onChange={(units) => update({ units })}
      />
      <ValueStepper
        display={String(tick)}
        unit="cm"
        label="Height"
        onStep={(d) => set(tick + d)}
        atMin={tick <= scale.min}
        atMax={tick >= scale.max}
        inputMode="numeric"
        parse={imperial ? undefined : (text) => applyTyped(text, scale, Math.round, (heightCm) => update({ heightCm }))}
      >
        {imperial ? (
          <span className="leading-none whitespace-nowrap">
            <b className="text-[52px] font-semibold tracking-[-0.02em] tabular-nums">{ft}</b>
            <span className="mr-2.5 ml-1 text-[17px] font-medium text-(--sp-text-muted)">ft</span>
            <b className="text-[52px] font-semibold tracking-[-0.02em] tabular-nums">{inch}</b>
            <span className="ml-1 text-[17px] font-medium text-(--sp-text-muted)">in</span>
          </span>
        ) : undefined}
      </ValueStepper>
      <Ruler
        value={tick}
        min={scale.min}
        max={scale.max}
        majorEvery={scale.majorEvery}
        label="Height"
        valueText={imperial ? `${ft} feet ${inch} inches` : `${tick} centimetres`}
        tickLabel={scale.label}
        onChange={set}
      />
    </>
  )
}

function WeightPicker() {
  const { draft, update } = useDraft()
  const units = draft.units
  const unit = weightUnit(units)
  const scale = weightScale(units)
  const tick = Math.min(scale.max, Math.max(scale.min, scale.toTick(draft.weightKg)))
  const set = (t: number) => update({ weightKg: scale.toMetric(Math.min(scale.max, Math.max(scale.min, t))) })

  const goal = goalWeightScale(units)
  const goalTick = Math.min(goal.max, Math.max(goal.min, goal.toTick(draft.goalWeightKg)))
  const setGoal = (t: number) => update({ goalWeightKg: goal.toMetric(Math.min(goal.max, Math.max(goal.min, t))) })

  return (
    <>
      <Segmented
        label="Weight unit"
        options={[
          { value: "METRIC", label: "kg" },
          { value: "IMPERIAL", label: "lb" },
        ]}
        value={units}
        onChange={(next) => update({ units: next })}
      />
      <ValueStepper
        display={weightNumber(scale.toMetric(tick), units)}
        unit={unit}
        label="Weight"
        onStep={(d) => set(tick + d)}
        atMin={tick <= scale.min}
        atMax={tick >= scale.max}
        inputMode={units === "IMPERIAL" ? "numeric" : "decimal"}
        parse={(text) =>
          applyTyped(text, scale, units === "IMPERIAL" ? Math.round : (n) => Math.round(n * 10), (weightKg) => update({ weightKg }))
        }
      />
      <Ruler
        value={tick}
        min={scale.min}
        max={scale.max}
        majorEvery={scale.majorEvery}
        label="Weight"
        valueText={`${weightNumber(scale.toMetric(tick), units)} ${unit === "kg" ? "kilograms" : "pounds"}`}
        tickLabel={scale.label}
        onChange={set}
      />
      <div className="mt-[22px] flex items-center gap-3.5 rounded-(--sp-radius) bg-(--sp-panel) p-4">
        <div className="flex-1">
          <div className="text-[15px] font-medium">
            Goal weight <span className="text-[13px] font-normal text-(--sp-text-muted)">· optional</span>
          </div>
          <div className="mt-0.5 text-xs text-(--sp-text-muted)">Shown on your progress chart</div>
        </div>
        <Switch
          label="Set a goal weight"
          checked={draft.goalWeightOn}
          onChange={(on) =>
            // First switch-on starts at the current weight.
            update(on && !draft.goalWeightOn ? { goalWeightOn: true, goalWeightKg: goal.toMetric(goal.toTick(draft.weightKg)) } : { goalWeightOn: on })
          }
        />
      </div>
      {draft.goalWeightOn && (
        <div className="mt-2 flex items-center justify-between rounded-(--sp-radius) bg-(--sp-panel) py-2 pr-2 pl-4">
          <span className="text-[13px] text-(--sp-text-muted)">Goal</span>
          <span className="flex items-center gap-2.5">
            <StepButton small kind="minus" label="Lower goal weight" onStep={() => setGoal(goalTick - 1)} disabled={goalTick <= goal.min} />
            <b className="min-w-[72px] text-center text-xl font-semibold tabular-nums" aria-live="polite">
              {shortWeight(goal.toMetric(goalTick), units)}{" "}
              <span className="text-[13px] font-medium text-(--sp-text-muted)">{unit}</span>
            </b>
            <StepButton small kind="plus" label="Higher goal weight" onStep={() => setGoal(goalTick + 1)} disabled={goalTick >= goal.max} />
          </span>
        </div>
      )}
    </>
  )
}
