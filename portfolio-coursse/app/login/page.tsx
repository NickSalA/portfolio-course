import { LoginCard } from "@/components/auth/login-card";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import styles from "./login-page.module.css";

type LoginPageProps = {
	searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
	const { error } = await searchParams;

	return (
		<main className={styles.shell}>
			<div className={styles.grid} aria-hidden="true" />
			<div
				className={`${styles.glow} ${styles.glowTop}`}
				aria-hidden="true"
			/>
			<div
				className={`${styles.glow} ${styles.glowBottom}`}
				aria-hidden="true"
			/>
			<div
				className={`${styles.glow} ${styles.glowBottom}`}
				aria-hidden="true"
			/>
			<div className={styles.themeToggle}>
				<ThemeToggle />
			</div>

			<section className={styles.story} aria-label="Aula">
				<div className={styles.brand}>
					<span className={styles.brandMark}>A</span>
					<span>
						<strong>AULA</strong>
						<small>ESPACIO ACADÉMICO</small>
					</span>
				</div>

				<div className={styles.storyCopy}>
					<p className={styles.eyebrow}>
						<span className={styles.pulse} /> Acceso institucional
					</p>
					<h1>Tu curso empieza con una buena conexión.</h1>
					<p className={styles.lead}>
						Un espacio para organizar grupos, reconocer el esfuerzo
						y mantener la actividad académica clara para todos.
					</p>
				</div>
			</section>

			<section className={styles.panel} aria-labelledby="login-title">
				<div className={styles.card}>
					<h2 id="login-title">Bienvenido de vuelta.</h2>
					<p className={styles.cardCopy}>
						Accede con tu cuenta institucional para consultar tus
						cursos o gestionar tu actividad docente.
					</p>
					<LoginCard initialError={error} />
				</div>
				<p className={styles.panelNote}>
					◉ Solo para cuentas autorizadas por la institución
				</p>
			</section>
		</main>
	);
}
