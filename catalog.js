// ══════════════════════════════════════════════
//  DorkCraft — Google Dork Intelligence Tool
// ══════════════════════════════════════════════

const OPERATORS = [
  { op: "site:",       desc: "Belirli bir sitede ara",         placeholder: "örn: example.com" },
  { op: "filetype:",   desc: "Dosya türüne göre filtrele",     placeholder: "örn: pdf, xls, doc" },
  { op: "inurl:",      desc: "URL içinde kelime ara",          placeholder: "örn: admin, login" },
  { op: "intitle:",    desc: "Sayfa başlığında ara",           placeholder: "örn: index of" },
  { op: "intext:",     desc: "Sayfa içeriğinde ara",           placeholder: "örn: password" },
  { op: "allinurl:",   desc: "URL'de tüm kelimeleri ara",      placeholder: "örn: admin panel" },
  { op: "allintitle:", desc: "Başlıkta tüm kelimeleri ara",   placeholder: "" },
  { op: "allintext:",  desc: "İçerikte tüm kelimeleri ara",   placeholder: "" },
  { op: "define:",     desc: "Tanım ara",                      placeholder: "örn: cybersecurity" },
  { op: "ext:",        desc: "Uzantıya göre filtrele",         placeholder: "örn: env, bak, sql" },
];

const EXTRA_REF = [
  { op: "OR / |",   desc: "İki terimden biri geçiyorsa eşleşir",    eg: 'admin OR login' },
  { op: "AND",      desc: "Her iki terim de geçmelidir",             eg: '"admin" AND "password"' },
  { op: "-",        desc: "Terimi sonuçlardan hariç tutar",          eg: '-site:youtube.com' },
  { op: '"..."',    desc: "Tam eşleşme için tırnak",                 eg: '"index of /etc"' },
  { op: "*",        desc: "Joker karakter / wildcard",               eg: '"admin * password"' },
  { op: "#..#",     desc: "Sayı aralığı arama",                      eg: 'port 8000..9000' },
  { op: "after:",   desc: "Belirli tarihten sonra",                  eg: 'after:2023-01-01' },
  { op: "before:",  desc: "Belirli tarihten önce",                   eg: 'before:2024-01-01' },
];

const TEMPLATES = [
  {
    category: "Açık Dizinler",
    color: "#ff6b35",
    items: [
      { name: "Açık Dizin Listesi",      dork: 'intitle:"index of" /' },
      { name: "Yedek Dosyalar",          dork: 'intitle:"index of" (backup|bak|old)' },
      { name: "Log Dosyaları",           dork: 'intitle:"index of" *.log' },
      { name: "Yapılandırma Dosyaları",  dork: 'intitle:"index of" (config|conf|cfg)' },
      { name: "SQL Dump Dosyaları",      dork: 'intitle:"index of" *.sql' },
    ],
  },
  {
    category: "Giriş Panelleri",
    color: "#ffd700",
    items: [
      { name: "Admin Panel",    dork: 'inurl:(admin|administrator) intitle:"login"' },
      { name: "WordPress Admin",dork: 'inurl:wp-admin intitle:"WordPress"' },
      { name: "phpMyAdmin",     dork: 'inurl:phpmyadmin intitle:"phpMyAdmin"' },
      { name: "cPanel Login",   dork: 'intitle:"cPanel" inurl:2083' },
      { name: "Webmail Girişi", dork: 'intitle:"webmail" inurl:webmail' },
    ],
  },
  {
    category: "Hassas Dosyalar",
    color: "#00ff88",
    items: [
      { name: ".env Dosyaları",       dork: 'filetype:env "DB_PASSWORD"' },
      { name: "Şifre Dosyaları",      dork: 'filetype:txt intext:"password" intext:"username"' },
      { name: "SSH Private Key",      dork: 'filetype:pem intext:"PRIVATE KEY"' },
      { name: "WordPress Config",     dork: 'filetype:php inurl:wp-config' },
      { name: "Git Config",           dork: 'inurl:.git/config filetype:config' },
      { name: "XML Veritabanı",       dork: 'filetype:xml intext:"<password>"' },
      { name: "Excel Şifre Listesi",  dork: 'filetype:xls intext:"username" intext:"password"' },
    ],
  },
  {
    category: "Güvenlik Kameraları",
    color: "#00bfff",
    items: [
      { name: "Axis Kameralar",    dork: 'intitle:"AXIS" inurl:view/view.shtml' },
      { name: "Webcam Görüntüleri",dork: 'intitle:"webcam" inurl:view' },
      { name: "IP Kamera Paneli", dork: 'inurl:"/view/index.shtml"' },
      { name: "Ağ Kameraları",    dork: 'intitle:"Live View / - AXIS"' },
    ],
  },
  {
    category: "Veritabanı & API",
    color: "#ff4da6",
    items: [
      { name: "MongoDB Exposed",  dork: 'inurl:27017 intitle:"MongoDB"' },
      { name: "Elasticsearch",    dork: 'inurl:9200 intitle:"Elasticsearch"' },
      { name: "API Key Leak",     dork: 'filetype:json intext:"api_key"' },
      { name: "AWS Credentials",  dork: 'filetype:ini intext:"aws_access_key_id"' },
      { name: "Database Errors",  dork: 'intext:"sql syntax near" intext:"on line"' },
    ],
  },
  {
    category: "Ağ & Cihazlar",
    color: "#9b59b6",
    items: [
      { name: "Router Paneli",  dork: 'intitle:"router" inurl:setup.cgi' },
      { name: "Cisco Router",   dork: 'intitle:"Cisco" intext:"IOS" inurl:exec' },
      { name: "Printer Paneli", dork: 'intitle:"HP LaserJet" inurl:info_configuration.htm' },
      { name: "VNC Viewer",     dork: 'inurl:5800 intitle:"VNC Viewer"' },
      { name: "Telnet Servisi", dork: 'inurl:23 intitle:"Telnet"' },
    ],
  },
  {
    category: "Raporlar & Belgeler",
    color: "#1abc9c",
    items: [
      { name: "Finansal Raporlar",   dork: 'filetype:pdf "confidential" "financial report"' },
      { name: "Gizli PDF\'ler",      dork: 'filetype:pdf intitle:"confidential" site:.gov' },
      { name: "Excel Verileri",      dork: 'filetype:xls "salary" OR "income" site:.gov' },
      { name: "Sosyal Güvenlik No",  dork: 'filetype:xls intext:"SSN" intext:"social security"' },
    ],
  },
];
