"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import BakeryDiningRoundedIcon from "@mui/icons-material/BakeryDiningRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import LayersRoundedIcon from "@mui/icons-material/LayersRounded";
import LocalPhoneRoundedIcon from "@mui/icons-material/LocalPhoneRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import SecurityRoundedIcon from "@mui/icons-material/SecurityRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import type { FormEvent, ReactNode } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  AppBar,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Drawer,
  IconButton,
  Link,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Toolbar,
  Typography,
} from "@mui/material";
import type {
  BenefitsProps,
  ComparisonProps,
  CountdownProps,
  CtaBannerProps,
  CtaAction,
  FooterProps,
  FormField,
  FormProps,
  FaqProps,
  GalleryProps,
  HeroProps,
  ImageProps,
  LogoCloudProps,
  NavbarProps,
  PricingProps,
  RichTextProps,
  StatsProps,
  StepsProps,
  TestimonialsProps,
  TrustBarProps,
  VideoProps,
} from "@/component-registry";

function getIcon(icon?: string, color: string = "currentColor"): ReactNode {
  const icons: Record<string, ReactNode> = {
    clock: <AccessTimeRoundedIcon sx={{ color }} />,
    sparkles: <AutoAwesomeRoundedIcon sx={{ color }} />,
    shield: <SecurityRoundedIcon sx={{ color }} />,
    phone: <LocalPhoneRoundedIcon sx={{ color }} />,
    check: <CheckCircleRoundedIcon sx={{ color }} />,
    star: <StarRoundedIcon sx={{ color }} />,
    user: <PersonRoundedIcon sx={{ color }} />,
    layers: <LayersRoundedIcon sx={{ color }} />,
    "chef-hat": <BakeryDiningRoundedIcon sx={{ color }} />,
    "cake-slice": <BakeryDiningRoundedIcon sx={{ color }} />,
    cherry: <AutoAwesomeRoundedIcon sx={{ color }} />,
    croissant: <BakeryDiningRoundedIcon sx={{ color }} />,
  };

  return icons[icon ?? ""] ?? <AutoAwesomeRoundedIcon sx={{ color }} />;
}

function getBenefitsSectionId(title: string) {
  return title.toLowerCase().includes("creation") ? "creations" : "benefits";
}

function getActionHref(action: string) {
  if (action === "scroll_to_form") {
    return "#lead-form";
  }

  if (action === "scroll_to_section") {
    return "#content";
  }

  return action;
}

function useInViewOnce<TElement extends Element>(threshold = 0.2) {
  const ref = useRef<TElement | null>(null);
  const [hasEnteredView, setHasEnteredView] = useState(false);

  useEffect(() => {
    if (hasEnteredView) {
      return;
    }

    const node = ref.current;

    if (!node) {
      return;
    }

    if (typeof IntersectionObserver === "undefined") {
      setHasEnteredView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setHasEnteredView(true);
          observer.disconnect();
        }
      },
      {
        threshold,
        rootMargin: "0px 0px -10% 0px",
      },
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [hasEnteredView, threshold]);

  return { ref, hasEnteredView };
}

function extractNumericMetric(value: string) {
  const match = value.match(/-?\d+(?:[.,]\d+)?/);

  if (!match) {
    return null;
  }

  const raw = match[0];
  const numericValue = Number(raw.replace(",", "."));

  if (Number.isNaN(numericValue)) {
    return null;
  }

  const startIndex = match.index ?? 0;
  const endIndex = startIndex + raw.length;
  const prefix = value.slice(0, startIndex);
  const suffix = value.slice(endIndex);
  const normalizedSuffix = suffix.trim().toLowerCase();
  let scale = 1;
  let displaySuffix = suffix;

  if (normalizedSuffix.startsWith("k")) {
    scale = 1000;
  } else if (normalizedSuffix.startsWith("m")) {
    scale = 1000000;
  } else if (normalizedSuffix.startsWith("b")) {
    scale = 1000000000;
  }

  return {
    raw,
    value: numericValue * scale,
    decimals: raw.includes(".") || raw.includes(",") ? 1 : 0,
    scale,
    prefix,
    suffix: displaySuffix,
  };
}

function formatMetricValue(template: string, nextValue: number) {
  const numericMetric = extractNumericMetric(template);

  if (!numericMetric) {
    return template;
  }

  const displayValue = nextValue / numericMetric.scale;

  return `${numericMetric.prefix}${displayValue.toLocaleString("fr-FR", {
      minimumFractionDigits: numericMetric.decimals,
      maximumFractionDigits: numericMetric.decimals,
    })}${numericMetric.suffix}`;
}

function AnimatedMetricValue({
  value,
  shouldAnimate,
}: {
  value: string;
  shouldAnimate?: boolean;
}) {
  const [displayValue, setDisplayValue] = useState(() =>
    shouldAnimate ? formatMetricValue(value, 0) : value,
  );

  useEffect(() => {
    const numericMetric = extractNumericMetric(value);

    if (!shouldAnimate || !numericMetric || numericMetric.suffix.includes("/")) {
      setDisplayValue(value);
      return;
    }

    let animationFrame = 0;
    const duration = 1400;
    const start = performance.now();

    const tick = (now: number) => {
      const linearProgress = Math.min((now - start) / duration, 1);
      const easedProgress = 1 - (1 - linearProgress) * (1 - linearProgress) * (1 - linearProgress);
      const nextValue = numericMetric.value * easedProgress;
      setDisplayValue(formatMetricValue(value, nextValue));

      if (linearProgress < 1) {
        animationFrame = window.requestAnimationFrame(tick);
      }
    };

    animationFrame = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(animationFrame);
    };
  }, [shouldAnimate, value]);

  return <>{displayValue}</>;
}

function Section({
  children,
  id,
}: {
  children: ReactNode;
  id?: string;
}) {
  const { ref, hasEnteredView } = useInViewOnce<HTMLElement>(0.12);

  return (
    <Box
      component="section"
      id={id}
      ref={ref}
      sx={{
        py: { xs: 4, md: 6 },
        opacity: hasEnteredView ? 1 : 0,
        transform: hasEnteredView ? "translateY(0)" : "translateY(28px)",
        transition: "opacity 700ms ease, transform 700ms ease",
        willChange: "opacity, transform",
      }}
    >
      <Container maxWidth="lg">{children}</Container>
    </Box>
  );
}

function ActionButton({
  cta,
  kind = "primary",
}: {
  cta?: CtaAction;
  kind?: "primary" | "secondary";
}) {
  if (!cta) {
    return null;
  }

  const isAnchorAction =
    cta.action === "scroll_to_form" ||
    cta.action === "scroll_to_section" ||
    cta.action.startsWith("#");

  if (isAnchorAction) {
    return (
      <Button
        component="a"
        href={getActionHref(cta.action)}
        variant={kind === "primary" ? "contained" : "outlined"}
        color={kind === "primary" ? "primary" : "inherit"}
        size="large"
        sx={{
          borderRadius: "var(--radius-button)",
          px: 3,
          py: 1.25,
        }}
      >
        {cta.label}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant={kind === "primary" ? "contained" : "outlined"}
      color={kind === "primary" ? "primary" : "inherit"}
      size="large"
      sx={{
        borderRadius: "var(--radius-button)",
        px: 3,
        py: 1.25,
      }}
    >
      {cta.label}
    </Button>
  );
}

function renderField(field: FormField) {
  if (field.type === "select") {
    return (
      <TextField
        defaultValue=""
        fullWidth
        key={field.name}
        label={field.label}
        name={field.name}
        required={field.required}
        select
      >
        <MenuItem disabled value="">
          {field.placeholder ?? "Choisissez une option"}
        </MenuItem>
        {(field.options ?? []).map((option) => (
          <MenuItem key={option} value={option}>
            {option}
          </MenuItem>
        ))}
      </TextField>
    );
  }

  if (field.type === "textarea") {
    return (
      <TextField
        fullWidth
        key={field.name}
        label={field.label}
        multiline
        name={field.name}
        placeholder={field.placeholder}
        required={field.required}
        rows={4}
      />
    );
  }

  return (
    <TextField
      fullWidth
      key={field.name}
      label={field.label}
      name={field.name}
      placeholder={field.placeholder}
      required={field.required}
      type={field.type}
    />
  );
}

export function HeroSection({
  variant = "split",
  eyebrow,
  headline,
  subheadline,
  primaryCta,
  secondaryCta,
  badges,
  media,
  stats,
}: HeroProps & { variant?: string }) {
  const centered = variant === "centered";

  return (
    <Section id="content">
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 6 },
          borderRadius: "var(--radius-section)",
          border: "1px solid",
          borderColor: "divider",
          background:
            "linear-gradient(135deg, color-mix(in srgb, var(--surface) 88%, white), color-mix(in srgb, var(--surface-alt) 92%, white))",
        }}
      >
        <Box
          sx={{
            display: "grid",
            gap: 4,
            alignItems: "center",
            gridTemplateColumns: centered ? "1fr" : { xs: "1fr", md: "1.1fr 0.9fr" },
            textAlign: centered ? "center" : "left",
          }}
        >
          <Stack spacing={3} alignItems={centered ? "center" : "flex-start"}>
            {eyebrow ? (
              <Typography color="primary" fontWeight={800} sx={{ letterSpacing: "0.08em" }} variant="overline">
                {eyebrow}
              </Typography>
            ) : null}
            <Typography sx={{ maxWidth: 760 }} variant="h1">
              {headline}
            </Typography>
            <Typography color="text.secondary" sx={{ maxWidth: 720 }} variant="h5">
              {subheadline}
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <ActionButton cta={primaryCta} />
              <ActionButton cta={secondaryCta} kind="secondary" />
            </Stack>
            {badges?.length ? (
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {badges.map((badge) => (
                  <Chip color="primary" key={badge} label={badge} variant="outlined" />
                ))}
              </Stack>
            ) : null}
            {stats?.length ? (
              <Box
                sx={{
                  display: "grid",
                  gap: 2,
                  width: "100%",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: `repeat(${Math.min(stats.length, 3)}, minmax(0, 1fr))`,
                  },
                }}
              >
                {stats.map((item) => (
                  <Card elevation={0} key={`${item.label}-${item.value}`} sx={{ borderRadius: "var(--radius-card)", border: "1px solid", borderColor: "divider" }}>
                    <CardContent>
                      <Typography variant="h4">{item.value}</Typography>
                      <Typography color="text.secondary">{item.label}</Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            ) : null}
          </Stack>
          {!centered ? (
            <Paper
              elevation={0}
              sx={{
                overflow: "hidden",
                minHeight: 360,
                borderRadius: "var(--radius-section)",
                border: "1px solid",
                borderColor: "divider",
                backgroundColor: "background.paper",
              }}
            >
              {media?.kind === "image" && media.src ? (
                <Box
                  alt={headline}
                  component="img"
                  src={media.src}
                  sx={{ display: "block", width: "100%", height: "100%", objectFit: "cover", minHeight: 360 }}
                />
              ) : (
                <Stack alignItems="center" justifyContent="center" spacing={1} sx={{ height: "100%", p: 4, textAlign: "center" }}>
                  {getIcon(media?.kind === "video" ? "sparkles" : "star", "var(--primary)")}
                  <Typography variant="h6">{media?.kind === "video" ? "Video" : "Visuel"}</Typography>
                  <Typography color="text.secondary">{media?.src ?? "Placeholder genere depuis la configuration JSON."}</Typography>
                  <Typography color="text.secondary" variant="body2">
                    Style: {media?.style ?? "professional"}
                  </Typography>
                </Stack>
              )}
            </Paper>
          ) : null}
        </Box>
      </Paper>
    </Section>
  );
}

export function BenefitsSection({
  variant = "cards",
  title,
  subtitle,
  columns = 3,
  items,
}: BenefitsProps & { variant?: string }) {
  return (
    <Section id={getBenefitsSectionId(title)}>
      <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: "var(--radius-section)", border: "1px solid", borderColor: "divider" }}>
        <Stack spacing={1.5} sx={{ mb: 3 }}>
          <Typography variant="h2">{title}</Typography>
          {subtitle ? <Typography color="text.secondary">{subtitle}</Typography> : null}
        </Stack>
        <Box
          sx={{
            display: "grid",
            gap: 3,
            gridTemplateColumns: {
              xs: "1fr",
              md: `repeat(${Math.min(Math.max(columns, 1), 4)}, minmax(0, 1fr))`,
            },
          }}
        >
          {items.map((item) => (
            <Card elevation={0} key={item.title} sx={{ height: "100%", borderRadius: "var(--radius-card)", border: "1px solid", borderColor: "divider" }}>
              <CardContent sx={{ p: 3 }}>
                <Stack spacing={2}>
                  <Avatar sx={{ bgcolor: "primary.main", color: "primary.contrastText", width: 52, height: 52 }}>
                    {getIcon(item.icon, "currentColor")}
                  </Avatar>
                  <Typography variant="h5">{item.title}</Typography>
                  <Typography color="text.secondary">{item.description}</Typography>
                  <Chip label={variant} size="small" sx={{ alignSelf: "flex-start" }} variant="outlined" />
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Paper>
    </Section>
  );
}

export function TestimonialsSection({
  title,
  items,
  variant = "grid",
}: TestimonialsProps & { variant?: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const safeIndex = items.length === 0 ? 0 : activeIndex % items.length;

  function renderTestimonialCard(item: TestimonialsProps["items"][number]) {
    return (
      <Card
        elevation={0}
        key={`${item.name}-${item.quote}`}
        sx={{ borderRadius: "var(--radius-card)", border: "1px solid", borderColor: "divider" }}
      >
        <CardContent sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Stack direction="row" spacing={0.5}>
              {Array.from({ length: item.rating }).map((_, index) => (
                <StarRoundedIcon fontSize="small" key={`${item.name}-${index}`} sx={{ color: "var(--primary)" }} />
              ))}
            </Stack>
            <Typography color="text.secondary">"{item.quote}"</Typography>
            <Box>
              <Typography variant="subtitle1">{item.name}</Typography>
              <Typography color="text.secondary" variant="body2">
                {item.role}
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  function goToPrevious() {
    setActiveIndex((current) => (current - 1 + items.length) % items.length);
  }

  function goToNext() {
    setActiveIndex((current) => (current + 1) % items.length);
  }

  return (
    <Section id="testimonials">
      <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: "var(--radius-section)", border: "1px solid", borderColor: "divider" }}>
        <Stack spacing={3}>
          <Typography variant="h2">{title}</Typography>
          {variant === "carousel" && items.length > 0 ? (
            <Stack spacing={2}>
              {renderTestimonialCard(items[safeIndex])}
              <Stack alignItems="center" direction="row" justifyContent="space-between">
                <IconButton
                  aria-label="Temoignage precedent"
                  color="primary"
                  onClick={goToPrevious}
                >
                  <ArrowBackIosNewRoundedIcon fontSize="small" />
                </IconButton>
                <Stack direction="row" spacing={1}>
                  {items.map((item, index) => (
                    <Box
                      key={`${item.name}-${index}-dot`}
                      onClick={() => setActiveIndex(index)}
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        bgcolor: index === safeIndex ? "primary.main" : "divider",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                    />
                  ))}
                </Stack>
                <IconButton
                  aria-label="Temoignage suivant"
                  color="primary"
                  onClick={goToNext}
                >
                  <ArrowForwardIosRoundedIcon fontSize="small" />
                </IconButton>
              </Stack>
            </Stack>
          ) : variant === "single" && items.length > 0 ? (
            renderTestimonialCard(items[0])
          ) : (
            <Box
              sx={{
                display: "grid",
                gap: 3,
                gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
              }}
            >
              {items.map((item) => renderTestimonialCard(item))}
            </Box>
          )}
        </Stack>
      </Paper>
    </Section>
  );
}

export function LeadFormSection({
  variant = "stacked",
  title,
  submitLabel,
  fields,
  successMessage,
}: FormProps & { variant?: string }) {
  const [submitted, setSubmitted] = useState(false);

  return (
    <Section id="lead-form">
      <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: "var(--radius-section)", border: "1px solid", borderColor: "divider" }}>
        <Stack spacing={3}>
          <Typography variant="h2">{title}</Typography>
          {submitted ? (
            <Paper elevation={0} sx={{ p: 2, borderRadius: "var(--radius-inner)", bgcolor: "success.light", color: "success.contrastText" }}>
              <Typography>{successMessage}</Typography>
            </Paper>
          ) : null}
          <Box
            component="form"
            onSubmit={(event: FormEvent<HTMLFormElement>) => {
              event.preventDefault();
              setSubmitted(true);
            }}
          >
            <Box
              sx={{
                display: "grid",
                gap: 2,
                gridTemplateColumns:
                  variant === "inline"
                    ? { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" }
                    : "1fr",
              }}
            >
              {fields.map(renderField)}
            </Box>
            <Button sx={{ mt: 3, borderRadius: "var(--radius-button)", px: 3, py: 1.25 }} type="submit" variant="contained">
              {submitLabel}
            </Button>
          </Box>
        </Stack>
      </Paper>
    </Section>
  );
}

export function FaqSection({ title, items }: FaqProps) {
  return (
    <Section id="faq">
      <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: "var(--radius-section)", border: "1px solid", borderColor: "divider" }}>
        <Stack spacing={2}>
          <Typography variant="h2">{title}</Typography>
          {items.map((item) => (
            <Accordion disableGutters elevation={0} key={item.question} sx={{ borderRadius: "var(--radius-card) !important", border: "1px solid", borderColor: "divider", "&:before": { display: "none" } }}>
              <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
                <Typography fontWeight={600}>{item.question}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography color="text.secondary">{item.answer}</Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Stack>
      </Paper>
    </Section>
  );
}

export function CtaBannerSection({ headline, subheadline, primaryCta }: CtaBannerProps) {
  return (
    <Section id="cta-banner">
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 4 },
          borderRadius: "var(--radius-section)",
          color: "primary.contrastText",
          background: "linear-gradient(135deg, var(--primary-dark), var(--primary))",
        }}
      >
        <Stack spacing={2}>
          <Typography color="inherit" variant="h3">
            {headline}
          </Typography>
          <Typography color="inherit" sx={{ opacity: 0.88 }}>
            {subheadline}
          </Typography>
          <ActionButton cta={primaryCta} kind="secondary" />
        </Stack>
      </Paper>
    </Section>
  );
}

export function TrustBarSection({ items }: TrustBarProps) {
  return (
    <Section id="trust-bar">
      <Paper elevation={0} sx={{ p: 3, borderRadius: "var(--radius-section)", border: "1px solid", borderColor: "divider" }}>
        <Stack direction="row" flexWrap="wrap" gap={1.5}>
          {items.map((item) => (
            <Chip
              icon={<CheckCircleRoundedIcon sx={{ color: "var(--primary)" }} />}
              key={item}
              label={item}
              sx={{ borderRadius: "var(--radius-chip)" }}
              variant="filled"
            />
          ))}
        </Stack>
      </Paper>
    </Section>
  );
}

export function StatsSection({
  items,
  variant = "cards",
  animate = false,
}: StatsProps & { variant?: string }) {
  const { ref, hasEnteredView } = useInViewOnce<HTMLDivElement>(0.25);
  const [progressReady, setProgressReady] = useState(false);

  useEffect(() => {
    if (!animate || !hasEnteredView) {
      setProgressReady(false);
      return;
    }

    const timeout = window.setTimeout(() => setProgressReady(true), 120);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [animate, hasEnteredView]);

  if (variant === "progress") {
    return (
      <Section id="stats">
        <Paper
          ref={ref}
          elevation={0}
          sx={{ p: { xs: 3, md: 4 }, borderRadius: "var(--radius-section)", border: "1px solid", borderColor: "divider" }}
        >
          <Stack spacing={3}>
            {items.map((item) => {
              const progressValue =
                typeof item.progress === "number"
                  ? Math.min(Math.max(item.progress, 0), 100)
                  : Math.min(Math.max(extractNumericMetric(item.value)?.value ?? 0, 0), 100);

              return (
                <Stack key={`${item.label}-${item.value}`} spacing={1.25}>
                  <Stack alignItems="center" direction="row" justifyContent="space-between" spacing={2}>
                    <Typography fontWeight={600}>{item.label}</Typography>
                    <Typography color="text.secondary">
                      <AnimatedMetricValue shouldAnimate={animate && hasEnteredView} value={item.value} />
                    </Typography>
                  </Stack>
                  <Box
                    sx={{
                      height: 12,
                      borderRadius: 999,
                      bgcolor: "rgba(15, 23, 42, 0.08)",
                      overflow: "hidden",
                    }}
                  >
                    <Box
                      sx={{
                        height: "100%",
                        width: `${animate ? (progressReady ? progressValue : 0) : progressValue}%`,
                        borderRadius: 999,
                        background: "linear-gradient(90deg, var(--primary), var(--primary-dark))",
                        transition: animate ? "width 900ms ease" : "none",
                      }}
                    />
                  </Box>
                </Stack>
              );
            })}
          </Stack>
        </Paper>
      </Section>
    );
  }

  return (
    <Section id="stats">
      <Box
        ref={ref}
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", md: `repeat(${Math.min(items.length, 4)}, minmax(0, 1fr))` },
        }}
      >
        {items.map((item) => (
          <Card elevation={0} key={`${item.label}-${item.value}`} sx={{ borderRadius: "var(--radius-card)", border: "1px solid", borderColor: "divider" }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h3">
                <AnimatedMetricValue shouldAnimate={animate && hasEnteredView} value={item.value} />
              </Typography>
              <Typography color="text.secondary">{item.label}</Typography>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Section>
  );
}

export function StepsSection({ title, items }: StepsProps) {
  return (
    <Section id="steps">
      <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: "var(--radius-section)", border: "1px solid", borderColor: "divider" }}>
        <Stack spacing={3}>
          <Typography variant="h2">{title}</Typography>
          <Box sx={{ display: "grid", gap: 3, gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" } }}>
            {items.map((item) => (
              <Card elevation={0} key={`${item.step}-${item.title}`} sx={{ borderRadius: "var(--radius-card)", border: "1px solid", borderColor: "divider" }}>
                <CardContent sx={{ p: 3 }}>
                  <Stack spacing={2}>
                    <Chip color="primary" label={`Etape ${item.step}`} sx={{ alignSelf: "flex-start" }} />
                    <Typography variant="h5">{item.title}</Typography>
                    <Typography color="text.secondary">{item.description}</Typography>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Stack>
      </Paper>
    </Section>
  );
}

export function ComparisonSection({ columns, rows }: ComparisonProps) {
  return (
    <Section id="comparison">
      <TableContainer component={Paper} elevation={0} sx={{ borderRadius: "var(--radius-section)", border: "1px solid", borderColor: "divider" }}>
        <Table>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell key={column} sx={{ fontWeight: 700 }}>
                  {column}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow key={`${row.join("-")}-${index}`}>
                {row.map((value, valueIndex) => (
                  <TableCell key={`${value}-${valueIndex}`}>{value}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Section>
  );
}

export function ImageSection({ src, alt }: ImageProps) {
  return (
    <Section id="gallery">
      <Paper elevation={0} sx={{ overflow: "hidden", borderRadius: "var(--radius-section)", border: "1px solid", borderColor: "divider" }}>
        <Box alt={alt} component="img" src={src} sx={{ display: "block", width: "100%", minHeight: 420, objectFit: "cover" }} />
      </Paper>
    </Section>
  );
}

export function GallerySection({
  title,
  subtitle,
  items,
  variant = "grid",
}: GalleryProps & { variant?: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const safeIndex = items.length === 0 ? 0 : activeIndex % items.length;

  function goToPrevious() {
    setActiveIndex((current) => (current - 1 + items.length) % items.length);
  }

  function goToNext() {
    setActiveIndex((current) => (current + 1) % items.length);
  }

  return (
    <Section id="gallery">
      <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: "var(--radius-section)", border: "1px solid", borderColor: "divider" }}>
        <Stack spacing={3}>
          {title ? <Typography variant="h2">{title}</Typography> : null}
          {subtitle ? <Typography color="text.secondary">{subtitle}</Typography> : null}

          {variant === "carousel" && items.length > 0 ? (
            <Stack spacing={2}>
              <Paper elevation={0} sx={{ overflow: "hidden", borderRadius: "var(--radius-card)", border: "1px solid", borderColor: "divider" }}>
                <Box
                  alt={items[safeIndex].alt}
                  component="img"
                  src={items[safeIndex].src}
                  sx={{
                    display: "block",
                    width: "100%",
                    height: { xs: 320, md: 440 },
                    objectFit: "contain",
                    bgcolor: "rgba(15, 23, 42, 0.04)",
                  }}
                />
              </Paper>
              <Stack alignItems="center" direction="row" justifyContent="space-between">
                <IconButton aria-label="Image precedente" color="primary" onClick={goToPrevious}>
                  <ArrowBackIosNewRoundedIcon fontSize="small" />
                </IconButton>
                <Stack direction="row" spacing={1}>
                  {items.map((item, index) => (
                    <Box
                      key={`${item.alt}-${index}-dot`}
                      onClick={() => setActiveIndex(index)}
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        bgcolor: index === safeIndex ? "primary.main" : "divider",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                    />
                  ))}
                </Stack>
                <IconButton aria-label="Image suivante" color="primary" onClick={goToNext}>
                  <ArrowForwardIosRoundedIcon fontSize="small" />
                </IconButton>
              </Stack>
            </Stack>
          ) : variant === "masonry" ? (
            <Box sx={{ columnCount: { xs: 1, sm: 2, md: 3 }, columnGap: 3 }}>
              {items.map((item, index) => (
                <Paper
                  elevation={0}
                  key={`${item.alt}-${index}`}
                  sx={{
                    overflow: "hidden",
                    borderRadius: "var(--radius-card)",
                    border: "1px solid",
                    borderColor: "divider",
                    mb: 3,
                    breakInside: "avoid",
                  }}
                >
                  <Box
                    alt={item.alt}
                    component="img"
                    src={item.src}
                    sx={{
                      display: "block",
                      width: "100%",
                      height: { xs: index % 2 === 0 ? 260 : 320, md: index % 2 === 0 ? 220 : 300 },
                      objectFit: "contain",
                      bgcolor: "rgba(15, 23, 42, 0.04)",
                    }}
                  />
                </Paper>
              ))}
            </Box>
          ) : variant === "stacked" ? (
            <Stack spacing={3}>
              {items.map((item, index) => (
                <Paper
                  elevation={0}
                  key={`${item.alt}-${index}`}
                  sx={{ overflow: "hidden", borderRadius: "var(--radius-card)", border: "1px solid", borderColor: "divider" }}
                >
                  <Box
                    alt={item.alt}
                    component="img"
                    src={item.src}
                    sx={{
                      display: "block",
                      width: "100%",
                      height: { xs: 320, md: 380 },
                      objectFit: "contain",
                      bgcolor: "rgba(15, 23, 42, 0.04)",
                    }}
                  />
                </Paper>
              ))}
            </Stack>
          ) : variant === "split" && items.length > 0 ? (
            <Box sx={{ display: "grid", gap: 3, gridTemplateColumns: { xs: "1fr", md: "1.4fr 0.8fr" } }}>
              <Paper elevation={0} sx={{ overflow: "hidden", borderRadius: "var(--radius-card)", border: "1px solid", borderColor: "divider" }}>
                <Box
                  alt={items[0].alt}
                  component="img"
                  src={items[0].src}
                  sx={{
                    display: "block",
                    width: "100%",
                    height: { xs: 340, md: 420 },
                    objectFit: "contain",
                    bgcolor: "rgba(15, 23, 42, 0.04)",
                  }}
                />
              </Paper>
              <Stack spacing={3}>
                {items.slice(1, 3).map((item, index) => (
                  <Paper
                    elevation={0}
                    key={`${item.alt}-${index}`}
                    sx={{ overflow: "hidden", borderRadius: "var(--radius-card)", border: "1px solid", borderColor: "divider", flex: 1 }}
                  >
                    <Box
                      alt={item.alt}
                      component="img"
                      src={item.src}
                      sx={{
                        display: "block",
                        width: "100%",
                        height: { xs: 220, md: 200 },
                        objectFit: "contain",
                        bgcolor: "rgba(15, 23, 42, 0.04)",
                      }}
                    />
                  </Paper>
                ))}
              </Stack>
            </Box>
          ) : (
            <Box
              sx={{
                display: "grid",
                gap: 3,
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, minmax(0, 1fr))",
                  md: `repeat(${Math.min(Math.max(items.length, 1), 3)}, minmax(0, 1fr))`,
                },
              }}
            >
              {items.map((item, index) => (
                <Paper
                  elevation={0}
                  key={`${item.alt}-${index}`}
                  sx={{ overflow: "hidden", borderRadius: "var(--radius-card)", border: "1px solid", borderColor: "divider" }}
                >
                  <Box
                    alt={item.alt}
                    component="img"
                    src={item.src}
                    sx={{
                      display: "block",
                      width: "100%",
                      height: { xs: 260, md: 280 },
                      objectFit: "contain",
                      bgcolor: "rgba(15, 23, 42, 0.04)",
                    }}
                  />
                </Paper>
              ))}
            </Box>
          )}
        </Stack>
      </Paper>
    </Section>
  );
}

export function VideoSection({ url }: VideoProps) {
  const videoUrl = useMemo(() => {
    if (url.includes("youtube.com/embed")) {
      return url;
    }

    if (url.includes("watch?v=")) {
      return url.replace("watch?v=", "embed/");
    }

    return url;
  }, [url]);

  return (
    <Section id="video">
      <Paper elevation={0} sx={{ overflow: "hidden", borderRadius: "var(--radius-section)", border: "1px solid", borderColor: "divider" }}>
        <Box
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          component="iframe"
          src={videoUrl}
          sx={{ display: "block", width: "100%", minHeight: 420, border: 0 }}
          title="Video section"
        />
      </Paper>
    </Section>
  );
}

export function RichTextSection({ content, align = "left" }: RichTextProps) {
  return (
    <Section id="rich-text">
      <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: "var(--radius-section)", border: "1px solid", borderColor: "divider" }}>
        <Box
          dangerouslySetInnerHTML={{ __html: content }}
          sx={{
            textAlign: align,
            "& p": { color: "text.secondary", lineHeight: 1.8 },
            "& h2, & h3": { m: 0, mb: 2 },
          }}
        />
      </Paper>
    </Section>
  );
}

export function CountdownSection({ endAt, label }: CountdownProps) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    function updateRemaining() {
      const endDate = new Date(endAt).getTime();
      const diff = endDate - Date.now();

      if (Number.isNaN(endDate) || diff <= 0) {
        setRemaining("Termine");
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setRemaining(`${hours}h ${minutes}m ${seconds}s`);
    }

    updateRemaining();
    const interval = window.setInterval(updateRemaining, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [endAt]);

  return (
    <Section id="countdown">
      <Card elevation={0} sx={{ borderRadius: "var(--radius-card)", border: "1px solid", borderColor: "divider" }}>
        <CardContent sx={{ p: 3 }}>
          <Stack spacing={1}>
            <Typography variant="h5">{label}</Typography>
            <Typography color="primary" variant="h4">
              {remaining}
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Section>
  );
}

export function PricingSection({ plans }: PricingProps) {
  return (
    <Section id="pricing">
      <Box sx={{ display: "grid", gap: 3, gridTemplateColumns: { xs: "1fr", md: `repeat(${Math.min(plans.length, 3)}, minmax(0, 1fr))` } }}>
        {plans.map((plan) => (
          <Card
            elevation={0}
            key={plan.name}
            sx={{
              height: "100%",
              borderRadius: "var(--radius-card)",
              border: "1px solid",
              borderColor: plan.highlight ? "primary.main" : "divider",
              boxShadow: plan.highlight ? "0 0 0 2px rgba(0,0,0,0.03)" : "none",
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Stack spacing={2}>
                <Typography variant="h5">{plan.name}</Typography>
                <Typography color="primary" variant="h4">
                  {plan.price}
                </Typography>
                <Stack spacing={1.25}>
                  {plan.features.map((feature) => (
                    <Stack alignItems="center" direction="row" key={feature} spacing={1}>
                      <CheckCircleRoundedIcon fontSize="small" sx={{ color: "var(--primary)" }} />
                      <Typography color="text.secondary">{feature}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Section>
  );
}

export function LogoCloudSection({ logos }: LogoCloudProps) {
  return (
    <Section id="logos">
      <Paper elevation={0} sx={{ p: 3, borderRadius: "var(--radius-section)", border: "1px solid", borderColor: "divider" }}>
        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(4, minmax(0, 1fr))" } }}>
          {logos.map((logo) => (
            <Paper
              elevation={0}
              key={logo}
              sx={{
                display: "grid",
                placeItems: "center",
                minHeight: 100,
                p: 2,
                borderRadius: "var(--radius-inner)",
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <Box alt="Logo partenaire" component="img" src={logo} sx={{ maxWidth: "100%", maxHeight: 46, objectFit: "contain" }} />
            </Paper>
          ))}
        </Box>
      </Paper>
    </Section>
  );
}

export function NavbarSection({ logoText, links, cta }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function closeMobileMenu() {
    setMobileMenuOpen(false);
  }

  return (
    <>
      <AppBar color="transparent" elevation={0} position="sticky" sx={{ backdropFilter: "blur(12px)", borderBottom: "1px solid", borderColor: "divider" }}>
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ justifyContent: "space-between", gap: 2, minHeight: 76 }}>
            <Typography fontWeight={800} variant="h6">
              {logoText}
            </Typography>
            <Stack direction="row" spacing={2} sx={{ display: { xs: "none", md: "flex" } }}>
              {links.map((link) => (
                <Link color="text.primary" href={link.href} key={`${link.href}-${link.label}`} underline="none">
                  {link.label}
                </Link>
              ))}
            </Stack>
            <Stack alignItems="center" direction="row" spacing={1}>
              <Box sx={{ display: { xs: "none", md: "block" } }}>
                <ActionButton cta={cta} />
              </Box>
              <IconButton
                aria-label="Ouvrir le menu"
                onClick={() => setMobileMenuOpen(true)}
                sx={{ display: { xs: "inline-flex", md: "none" }, color: "text.primary" }}
              >
                <MenuRoundedIcon sx={{ color: "inherit" }} />
              </IconButton>
            </Stack>
          </Toolbar>
        </Container>
      </AppBar>

      <Drawer
        anchor="right"
        onClose={closeMobileMenu}
        open={mobileMenuOpen}
        PaperProps={{
          sx: {
            width: "min(88vw, 360px)",
            p: 3,
          },
        }}
      >
        <Stack spacing={3}>
          <Stack alignItems="center" direction="row" justifyContent="space-between">
            <Typography fontWeight={800} variant="h6">
              {logoText}
            </Typography>
            <IconButton aria-label="Fermer le menu" onClick={closeMobileMenu} sx={{ color: "text.primary" }}>
              <CloseRoundedIcon sx={{ color: "inherit" }} />
            </IconButton>
          </Stack>

          <Divider />

          <Stack spacing={2}>
            {links.map((link) => (
              <Link
                color="text.primary"
                href={link.href}
                key={`${link.href}-${link.label}-mobile`}
                onClick={closeMobileMenu}
                underline="none"
              >
                {link.label}
              </Link>
            ))}
          </Stack>

          <Divider />

          <Box onClick={closeMobileMenu}>
            <ActionButton cta={cta} />
          </Box>
        </Stack>
      </Drawer>
    </>
  );
}

export function FooterSection({ columns }: FooterProps) {
  return (
    <Section id="footer">
      <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: "var(--radius-section)", border: "1px solid", borderColor: "divider" }}>
        <Box sx={{ display: "grid", gap: 4, gridTemplateColumns: { xs: "1fr", md: `repeat(${Math.min(columns.length, 3)}, minmax(0, 1fr))` } }}>
          {columns.map((column) => (
            <Stack key={column.title} spacing={1.5}>
              <Typography variant="h6">{column.title}</Typography>
              {column.links.map((link) => (
                <Link color="text.secondary" href={link.href} key={`${column.title}-${link.href}`} underline="hover">
                  {link.label}
                </Link>
              ))}
            </Stack>
          ))}
        </Box>
      </Paper>
    </Section>
  );
}
