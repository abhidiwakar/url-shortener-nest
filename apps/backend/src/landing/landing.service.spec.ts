import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { LandingService } from './landing.service';

describe('LandingService', () => {
  let service: LandingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [
            () => ({
              PUBLIC_BASE_URL: 'https://moklay.test',
            }),
          ],
        }),
      ],
      providers: [LandingService],
    }).compile();

    service = module.get(LandingService);
  });

  it('renders SEO metadata and canonical URL', () => {
    const html = service.renderLandingPage();

    expect(html).toContain('<title>moklay — Managed URL shortener</title>');
    expect(html).toContain('rel="canonical" href="https://moklay.test"');
    expect(html).toContain('application/ld+json');
    expect(html).toContain('Short links your team can trust and manage');
    expect(html).toContain('https://moklay.test/register');
    expect(html).toContain('class="brand-mark"');
    expect(html).toContain('#1769aa');
    expect(html).toContain('rel="icon" type="image/svg+xml" href="data:image/svg+xml,');
    expect(html).toContain('id="hero-shorten-form"');
    expect(html).toContain('Shorten a URL');
    expect(html).toContain('data-url-param="url"');
    expect(html).toContain('buildDestination');
    expect(html).toContain('data-my-links-url="https://moklay.test/my-links"');
  });

  it('renders robots.txt with sitemap reference', () => {
    const robots = service.renderRobotsTxt();

    expect(robots).toContain('Sitemap: https://moklay.test/sitemap.xml');
    expect(robots).toContain('Disallow: /api/');
  });

  it('renders sitemap.xml with public pages', () => {
    const sitemap = service.renderSitemapXml();

    expect(sitemap).toContain('<loc>https://moklay.test</loc>');
    expect(sitemap).toContain('<loc>https://moklay.test/developers</loc>');
  });
});
