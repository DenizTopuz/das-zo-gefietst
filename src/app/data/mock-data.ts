import { Incident, MatrixSign, Roadwork, TrafficJam, TrafficMeasure } from './models';

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const now = Date.now();
const ago = (ms: number) => new Date(now - ms);
const inFuture = (ms: number) => new Date(now + ms);

export const INCIDENTS: Incident[] = [
  { id: 'INC-4821', type: 'Ongeval', road: 'A2', direction: 'Amsterdam', location: 'Knooppunt Oudenrijn', severity: 'hoog', status: 'In behandeling', startedAt: ago(48 * MIN), lanesBlocked: 2, delayMinutes: 35, description: 'Aanrijding met drie voertuigen. Twee rijstroken afgesloten, berging onderweg.', coordinates: [5.0445, 52.0612] },
  { id: 'INC-4822', type: 'Pechgeval', road: 'A12', direction: 'Den Haag', location: 'Tussen Gouda en Waddinxveen', severity: 'laag', status: 'Gemeld', startedAt: ago(12 * MIN), lanesBlocked: 0, delayMinutes: 2, description: 'Voertuig op de vluchtstrook. Weginspecteur ter plaatse.', coordinates: [4.7312, 52.0201] },
  { id: 'INC-4823', type: 'Obstakel', road: 'A4', direction: 'Den Haag', location: 'Afrit Schiphol', severity: 'middel', status: 'In behandeling', startedAt: ago(26 * MIN), lanesBlocked: 1, delayMinutes: 12, description: 'Verloren lading op de rechterrijstrook. Rijkswaterstaat ruimt op.', coordinates: [4.7421, 52.3015] },
  { id: 'INC-4824', type: 'Ongeval', road: 'A27', direction: 'Breda', location: 'Bij Houten', severity: 'middel', status: 'In behandeling', startedAt: ago(1.5 * HOUR), lanesBlocked: 1, delayMinutes: 18, description: 'Kop-staartbotsing. Rechterrijstrook afgesloten.', coordinates: [5.1712, 52.0314] },
  { id: 'INC-4825', type: 'Gevaarlijke stof', road: 'A15', direction: 'Rotterdam', location: 'Botlekbrug', severity: 'hoog', status: 'Gemeld', startedAt: ago(9 * MIN), lanesBlocked: 3, delayMinutes: 40, description: 'Lekkage gevaarlijke stof. Brandweer en milieudienst ter plaatse; weg volledig dicht.', coordinates: [4.3012, 51.8832] },
  { id: 'INC-4826', type: 'Brand', road: 'A50', direction: 'Eindhoven', location: 'Bij Veldhoven', severity: 'middel', status: 'In behandeling', startedAt: ago(35 * MIN), lanesBlocked: 2, delayMinutes: 15, description: 'Voertuigbrand. Brandweer is aanwezig, rookontwikkeling.', coordinates: [5.4821, 51.4512] },
  { id: 'INC-4827', type: 'Pechgeval', road: 'A58', direction: 'Eindhoven', location: 'Afrit Tilburg-Reeshof', severity: 'laag', status: 'Opgelost', startedAt: ago(3 * HOUR), lanesBlocked: 0, delayMinutes: 0, description: 'Voertuig is weggesleept. Verkeer rijdt weer normaal.', coordinates: [5.1002, 51.5612] },
  { id: 'INC-4828', type: 'Ongeval', road: 'A10', direction: 'Zaandam', location: 'Coentunnel', severity: 'middel', status: 'Gemeld', startedAt: ago(6 * MIN), lanesBlocked: 1, delayMinutes: 10, description: 'Flankschade in de tunnel. Linker tunnelbuis beperkt beschikbaar.', coordinates: [4.8512, 52.4012] },
  { id: 'INC-4829', type: 'Obstakel', road: 'A1', direction: 'Amersfoort', location: 'Bij Barneveld', severity: 'laag', status: 'In behandeling', startedAt: ago(55 * MIN), lanesBlocked: 0, delayMinutes: 4, description: 'Dier op de rijbaan gesignaleerd. Politie onderweg.', coordinates: [5.6012, 52.1512] },
  { id: 'INC-4830', type: 'Pechgeval', road: 'A13', direction: 'Rotterdam', location: 'Bij Delft', severity: 'laag', status: 'Gemeld', startedAt: ago(20 * MIN), lanesBlocked: 0, delayMinutes: 3, description: 'Vrachtwagen met pech op de vluchtstrook.', coordinates: [4.3812, 52.0112] },
];

export const ROADWORKS: Roadwork[] = [
  { id: 'WW-1042', title: 'Asfaltonderhoud A2 Utrecht – Everdingen', type: 'Asfaltering', road: 'A2', from: 'Knooppunt Oudenrijn', to: 'Everdingen', status: 'Actief', impact: 'Rijstrookbeperking', authority: 'Rijkswaterstaat', start: ago(2 * DAY), end: inFuture(5 * DAY), description: 'Vervanging van de toplaag in beide richtingen. Nachtelijke werkzaamheden met één rijstrook minder beschikbaar.', lanesAffected: '1 van 3 rijstroken', coordinates: [[5.0445, 52.0612], [5.0001, 52.0042], [5.0112, 51.9602]] },
  { id: 'WW-1043', title: 'Verbreding A27 Houten – Hooipolder', type: 'Verbreding', road: 'A27', from: 'Houten', to: 'Hooipolder', status: 'Actief', impact: 'Beperkte hinder', authority: 'Rijkswaterstaat', start: ago(120 * DAY), end: inFuture(300 * DAY), description: 'Meerjarig project voor extra rijstroken. Verkeer wordt over versmalde rijstroken geleid.', lanesAffected: 'Versmalde rijstroken', coordinates: [[5.1712, 52.0314], [5.1301, 51.9802], [5.0802, 51.9302]] },
  { id: 'WW-1044', title: 'Renovatie Van Brienenoordbrug', type: 'Brugrenovatie', road: 'A16', from: 'Kreekhuizen', to: 'Knooppunt Terbregseplein', status: 'Gepland', impact: 'Rijstrookbeperking', authority: 'Rijkswaterstaat', start: inFuture(9 * DAY), end: inFuture(40 * DAY), description: 'Renovatie van voegovergangen. Tijdens werkzaamheden is één rijbaan beperkt beschikbaar.', lanesAffected: '2 van 4 rijstroken', coordinates: [[4.5302, 51.9002], [4.5002, 51.9142], [4.4702, 51.9302]] },
  { id: 'WW-1045', title: 'Nachtafsluiting Coentunnel', type: 'Tunnelonderhoud', road: 'A10', from: 'Amsterdam-Westpoort', to: 'Coenplein', status: 'Gepland', impact: 'Afsluiting', authority: 'Rijkswaterstaat', start: inFuture(3 * DAY), end: inFuture(3 * DAY + 8 * HOUR), description: 'Jaarlijks onderhoud aan de tunnelinstallaties. De tunnel is in één richting dicht, omleiding via A5.', lanesAffected: 'Volledige afsluiting (nacht)', coordinates: [[4.8302, 52.4062], [4.8602, 52.4012], [4.8902, 52.3912]] },
  { id: 'WW-1046', title: 'Vervangen geleiderail A12', type: 'Onderhoud', road: 'A12', from: 'Gouda', to: 'Woerden', status: 'Actief', impact: 'Beperkte hinder', authority: 'Rijkswaterstaat', start: ago(1 * DAY), end: inFuture(3 * DAY), description: 'Vervanging van de middenberm-geleiderail. Werkvak op de linkerrijstrook.', lanesAffected: '1 van 2 rijstroken', coordinates: [[4.7112, 52.0151], [4.8502, 52.0451], [4.9202, 52.0802]] },
  { id: 'WW-1047', title: 'Onderhoud N65 Vught – Tilburg', type: 'Onderhoud', road: 'N65', from: 'Vught', to: 'Tilburg', status: 'Gepland', impact: 'Beperkte hinder', authority: 'Provincie Noord-Brabant', start: inFuture(14 * DAY), end: inFuture(24 * DAY), description: 'Herstel van wegmarkering en berm. Wisselend afgesloten rijstroken overdag.', lanesAffected: 'Wisselend, 1 rijstrook', coordinates: [[5.2802, 51.6602], [5.2102, 51.6202], [5.1002, 51.5802]] },
  { id: 'WW-1048', title: 'Aanpassing aansluiting A50 Veldhoven', type: 'Verbreding', road: 'A50', from: 'Veldhoven', to: 'Eindhoven-Centrum', status: 'Afgerond', impact: 'Beperkte hinder', authority: 'Rijkswaterstaat', start: ago(80 * DAY), end: ago(4 * DAY), description: 'Nieuwe invoegstrook en geluidsscherm opgeleverd.', lanesAffected: 'Geen', coordinates: [[5.4821, 51.4512], [5.4602, 51.4312], [5.4402, 51.4112]] },
  { id: 'WW-1049', title: 'Weekendafsluiting A4 Schiphol', type: 'Asfaltering', road: 'A4', from: 'Schiphol', to: 'Hoofddorp', status: 'Gepland', impact: 'Afsluiting', authority: 'Rijkswaterstaat', start: inFuture(5 * DAY), end: inFuture(7 * DAY), description: 'Weekendafsluiting richting Den Haag voor vervangen asfalt. Omleiding via A9 en A5.', lanesAffected: 'Rijbaan richting Den Haag dicht', coordinates: [[4.7421, 52.3015], [4.7002, 52.2702], [4.6702, 52.2402]] },
];

export const TRAFFIC_JAMS: TrafficJam[] = [
  { id: 'FILE-1', road: 'A2', direction: 'Amsterdam', lengthKm: 7, delayMinutes: 35, cause: 'Ongeval', coordinates: [[5.0445, 52.0612], [5.0192, 52.0302], [5.0001, 52.0042], [4.9852, 51.9802]] },
  { id: 'FILE-2', road: 'A15', direction: 'Rotterdam', lengthKm: 9, delayMinutes: 40, cause: 'Gevaarlijke stof', coordinates: [[4.3012, 51.8832], [4.3902, 51.8802], [4.4902, 51.8852], [4.5602, 51.8872]] },
  { id: 'FILE-3', road: 'A27', direction: 'Breda', lengthKm: 4, delayMinutes: 18, cause: 'Ongeval', coordinates: [[5.1712, 52.0314], [5.1612, 52.0002], [5.1512, 51.9802]] },
  { id: 'FILE-4', road: 'A10', direction: 'Zaandam', lengthKm: 3, delayMinutes: 10, cause: 'Ongeval', coordinates: [[4.8512, 52.4012], [4.8212, 52.3902], [4.7902, 52.3802]] },
  { id: 'FILE-5', road: 'A50', direction: 'Eindhoven', lengthKm: 5, delayMinutes: 15, cause: 'Voertuigbrand', coordinates: [[5.4821, 51.4512], [5.5102, 51.4712], [5.5302, 51.4952]] },
];

const sign = (id: string, road: string, hm: string, display: MatrixSign['display'], lng: number, lat: number, online = true): MatrixSign =>
  ({ id, road, hectometer: hm, display, online, coordinates: [lng, lat] });

export const MATRIX_SIGNS: MatrixSign[] = [
  sign('MSI-A2-312', 'A2', '31,2', '70', 5.0302, 52.0402),
  sign('MSI-A2-318', 'A2', '31,8', '50', 5.0172, 52.0202),
  sign('MSI-A2-325', 'A2', '32,5', 'X', 5.0042, 52.0002),
  sign('MSI-A15-081', 'A15', '8,1', 'X', 4.3302, 51.8812),
  sign('MSI-A15-088', 'A15', '8,8', '50', 4.3902, 51.8782),
  sign('MSI-A27-441', 'A27', '44,1', '80', 5.1632, 52.0112),
  sign('MSI-A10-043', 'A10', '4,3', '70', 4.8422, 52.3972),
  sign('MSI-A4-102', 'A4', '10,2', '100', 4.7302, 52.2902),
  sign('MSI-A12-221', 'A12', '22,1', 'leeg', 4.7802, 52.0301, false),
  sign('MSI-A50-157', 'A50', '15,7', '70', 5.4902, 51.4602),
  sign('MSI-A58-071', 'A58', '7,1', '100', 5.1102, 51.5632),
  sign('MSI-A1-614', 'A1', '61,4', '100', 5.5802, 52.1502),
];

export const MEASURES: TrafficMeasure[] = [
  { id: 'MM-01', name: 'Snelheidsverlaging A2 Oudenrijn', type: 'Dynamische snelheid', roads: ['A2'], active: true, activatedBy: 'Verkeerscentrum West-Nederland', since: ago(44 * MIN), description: 'Gefaseerde snelheidsverlaging naar 50 km/u bij het staartuiteinde van de file.' },
  { id: 'MM-02', name: 'Rijstrooksluiting A15 Botlekbrug', type: 'Rijstrooksluiting', roads: ['A15'], active: true, activatedBy: 'Verkeerscentrum West-Nederland', since: ago(8 * MIN), description: 'Alle rijstroken dicht door gevaarlijke stof. Rode kruisen boven alle rijstroken.' },
  { id: 'MM-03', name: 'Spitsstrook A27 Houten open', type: 'Spitsstrook', roads: ['A27'], active: false, activatedBy: '-', description: 'Spitsstrook kan worden geopend bij oplopende drukte richting Breda.' },
  { id: 'MM-04', name: 'Omleiding A4 via A9', type: 'Omleiding', roads: ['A4', 'A9'], active: false, activatedBy: '-', description: 'Voorbereide omleidingsroute voor weekendafsluiting A4 Schiphol.' },
  { id: 'MM-05', name: 'Brugbediening Van Brienenoordbrug', type: 'Brugbediening', roads: ['A16'], active: false, activatedBy: '-', description: 'Aangepast brugschema tijdens renovatiewerkzaamheden.' },
  { id: 'MM-06', name: 'Dynamische snelheid A10 Coentunnel', type: 'Dynamische snelheid', roads: ['A10'], active: true, activatedBy: 'Verkeerscentrum West-Nederland', since: ago(5 * MIN), description: 'Max. 70 km/u in de tunnel na incident.' },
];

export const DAILY_INCIDENTS = [
  { day: 'Di', value: 14 }, { day: 'Wo', value: 11 }, { day: 'Do', value: 17 },
  { day: 'Vr', value: 21 }, { day: 'Za', value: 8 }, { day: 'Zo', value: 6 }, { day: 'Ma', value: 13 },
];
