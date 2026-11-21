import { useLayoutEffect, useState } from 'react';
import { parseCssColor, type Rgb } from '../model/color';
import { styleToCssVars, type ResolvedStyle } from '../model/style';
import { themeClass, type TemplateDef } from '../templates/registry';

const WHITE: Rgb = { r: 255, g: 255, b: 255 };

/**
 * The colour the template's accent sits on: its page, or the sidebar when `accentOn` says so. Themes own --cv-page in CSS, so we ask
 * the browser: render an off-screen probe with the same classes and knobs and
 * read its computed background.
 */
export function usePageColor(template: TemplateDef, style: ResolvedStyle): Rgb {
  const [color, setColor] = useState<Rgb>(WHITE);
  const vars = styleToCssVars(style);
  const varsKey = JSON.stringify(vars);

  useLayoutEffect(() => {
    const probe = document.createElement('div');
    probe.className = `cv-page cv-skeleton-${template.skeleton} ${themeClass(template)}`;
    probe.setAttribute('aria-hidden', 'true');
    probe.style.cssText = 'position:absolute;left:-10000px;top:0;visibility:hidden;min-height:0;height:0';
    for (const [name, value] of Object.entries(JSON.parse(varsKey) as Record<string, string>)) {
      probe.style.setProperty(name, value);
    }
    // Where the accent is drawn: the page, or a sidebar the theme paints behind it.
    const surface = document.createElement('div');
    surface.style.background = template.accentOn === 'sidebar' ? 'var(--cv-sidebar-bg)' : 'var(--cv-page)';
    probe.append(surface);
    document.body.append(probe);
    const parsed = parseCssColor(getComputedStyle(surface).backgroundColor);
    probe.remove();
    setColor((prev) =>
      parsed && (parsed.r !== prev.r || parsed.g !== prev.g || parsed.b !== prev.b) ? parsed : prev,
    );
  }, [template, varsKey]);

  return color;
}
