import { AlertTriangle, FileText, Pill, ExternalLink, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import ChatWidget from "@/components/ChatWidget";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { useState } from "react";

// Mock ingredient data
const mockIngredients = [
	{ name: "Dipirona Sódica", safe: true },
	{ name: "Sacarina Sódica", safe: true },
	{ name: "Água Purificada", safe: true },
	{ name: "Lactose Monohidratada", safe: false, warning: "Derivado do leite" },
	{ name: "Estearato de Magnésio", safe: false, warning: "Pode conter traços de leite" },
	{ name: "Aroma de Framboesa", safe: true },
	{ name: "Corante Amarelo", safe: true },
];

const MedicationDetails = () => {
	const navigate = useNavigate();
	const [sidebarOpen, setSidebarOpen] = useState(false);

	return (
		<div className="min-h-screen bg-background flex">
			{/* Sidebar - Desktop */}
			<div className="hidden lg:block">
				<Sidebar />
			</div>

			{/* Mobile Drawer (controlled via state; trigger is a header button) */}
			<Drawer open={sidebarOpen} onOpenChange={setSidebarOpen}>
				<DrawerContent className="h-[85vh]">
					<Sidebar isDrawer={true} onClose={() => setSidebarOpen(false)} />
				</DrawerContent>
			</Drawer>

			<main className="flex-1 lg:ml-64 w-full">
				<div className="w-full h-full p-4 md:p-6 lg:p-8">
					<div className="w-full max-w-4xl lg:max-w-7xl mx-auto">
						{/* Header */}
						<div className="flex items-center justify-between mb-4 md:mb-6 lg:mb-10 animate-fade-in">
							<button
								onClick={() => setSidebarOpen(true)}
								className="lg:hidden p-2 rounded-md bg-card"
							>
								<Menu className="w-5 h-5 text-foreground" />
							</button>
							<button
								onClick={() => navigate("/dashboard")}
								className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
							>
								<span>← Voltar para busca</span>
							</button>
						</div>

						{/* Two Column Layout */}
						<div className="grid lg:grid-cols-2 gap-4 md:gap-6 lg:gap-8">
							{/* Left Column - Product Overview */}
							<div className="space-y-4 md:space-y-6 animate-fade-in">
								{/* Product Image Placeholder */}
								<div className="aspect-square max-w-full md:max-w-xs bg-secondary rounded-lg md:rounded-2xl flex items-center justify-center">
									<Pill className="w-20 h-20 md:w-24 md:h-24 text-muted-foreground/40" />
								</div>

								{/* Product Title */}
								<div>
									<h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
										Dipirona Sódica Gotas
									</h1>
									<p className="text-sm md:text-base text-muted-foreground">
										Laboratório Medley
									</p>
								</div>

								{/* Risk Status Summary Box */}
								<div className="p-4 md:p-5 rounded-lg md:rounded-2xl bg-risk/10 border-2 border-risk/30">
									<div className="flex items-start gap-3">
										<AlertTriangle className="w-5 h-5 md:w-6 md:h-6 text-risk flex-shrink-0 mt-0.5" />
										<div>
											<h3 className="font-bold text-risk-foreground text-base md:text-lg">
												ALERTA: Contém Excipientes Derivados do Leite
											</h3>
											<p className="text-sm text-risk-foreground/80 mt-1">
												Este medicamento contém ingredientes que podem causar reação em
												crianças com APLV.
											</p>
										</div>
									</div>
								</div>
							</div>

							{/* Right Column - Composition Analysis */}
							<div className="space-y-4 md:space-y-6 animate-slide-in-right">
								<div className="card-soft">
									<h2 className="text-lg md:text-xl font-bold text-foreground mb-4 md:mb-6 flex items-center gap-2">
										<FileText className="w-4 h-4 md:w-5 md:h-5 text-primary" />
										Análise da Composição e Excipientes
									</h2>

									{/* Ingredients List */}
									<div className="space-y-3">
										{mockIngredients.map((ingredient, index) => (
											<div
												key={index}
												className={`flex items-center justify-between p-3 md:p-4 rounded-lg md:rounded-xl transition-colors ${
													ingredient.safe
														? "bg-secondary/50"
														: "bg-risk/10 border border-risk/30"
												}`}
											>
												<div className="flex items-center gap-2 md:gap-3">
													{!ingredient.safe && (
														<AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-risk flex-shrink-0" />
													)}
													<span
														className={`font-medium ${
															ingredient.safe
																? "text-muted-foreground"
																: "text-risk-foreground font-bold"
														}`}
													>
														{ingredient.name}
													</span>
												</div>
												{!ingredient.safe && (
													<span className="text-xs md:text-sm text-risk-foreground/80">
														{ingredient.warning}
													</span>
												)}
											</div>
										))}
									</div>

									{/* View Original Bula Button */}
									<button className="mt-6 w-full flex items-center justify-center gap-2 py-4 px-6 rounded-xl border-2 border-primary text-primary font-semibold hover:bg-primary/5 transition-colors">
										<ExternalLink className="w-5 h-5" />
										Visualizar Bula Original (PDF)
									</button>
								</div>

								{/* Info Note */}
								<div className="p-5 rounded-2xl bg-caution/10 border border-caution/30">
									<p className="text-sm text-caution-foreground">
										<strong>Nota:</strong> Esta análise é baseada em dados públicos.
										Sempre consulte a bula oficial e seu médico antes de administrar
										qualquer medicamento.
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</main>

			<ChatWidget />
		</div>
	);
};

export default MedicationDetails;
