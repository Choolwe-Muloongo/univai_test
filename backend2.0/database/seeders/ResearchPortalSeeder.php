<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ResearchPortalSeeder extends Seeder
{
    public function run(): void
    {
        $records = [
            ['project','AI for Adaptive University Learning','Active',['abstract'=>'Investigating personalised learning systems for university students.','category'=>'Artificial Intelligence','principalInvestigator'=>'Research Office','budget'=>85000,'fundingSource'=>'University Innovation Fund','startDate'=>'2026-02-01','endDate'=>'2027-01-31','milestones'=>['Literature review','Prototype','Pilot study'],'deliverables'=>['Dataset','Prototype','Research paper'],'partners'=>['UnivAI Learning Lab']]],
            ['project','Digital Finance Access for Students','Funded',['abstract'=>'Exploring inclusive digital finance and responsible student payment systems.','category'=>'Fintech','principalInvestigator'=>'Research Office','budget'=>120000,'fundingSource'=>'Innovation Grant','startDate'=>'2026-04-15','endDate'=>'2027-04-14','milestones'=>['Concept note','Field study'],'deliverables'=>['Policy brief','Dataset'],'partners'=>['Fintech Community']]],
            ['project','Climate-Smart Campus','Proposal',['abstract'=>'A living-lab study of energy efficiency and climate resilience on campus.','category'=>'Climate','principalInvestigator'=>'Research Office','budget'=>50000,'fundingSource'=>'Pending','startDate'=>'2026-09-01','endDate'=>'2027-08-31','milestones'=>['Proposal review'],'deliverables'=>['Campus climate baseline'],'partners'=>['Climate Living Lab']]],
            ['funding','African Innovation Research Fund','Active',['organization'=>'AU-EU Innovation','category'=>'Innovation','deadline'=>'2026-09-18','amount'=>'€100,000','description'=>'Support for collaborative African research and innovation projects.','eligibility'=>'Universities and research teams with African partners.','applicationUrl'=>'']],
            ['funding','Digital Education Research Call','Active',['organization'=>'Mastercard Foundation','category'=>'Education','deadline'=>'2026-10-02','amount'=>'$150,000','description'=>'Research addressing equitable digital access and learning outcomes.','eligibility'=>'Higher education institutions and eligible partners.','applicationUrl'=>'']],
            ['funding','Climate Innovation Grant','Active',['organization'=>'UNDP','category'=>'Climate','deadline'=>'2026-10-20','amount'=>'$75,000','description'=>'Applied research and prototypes for climate resilience.','eligibility'=>'Research institutions, innovators and consortia.','applicationUrl'=>'']],
            ['publication','Personalised Learning in African Universities','Published',['authors'=>['UnivAI Research Team'],'abstract'=>'A study of adaptive learning approaches in African higher education.','keywords'=>['AI','education','personalisation'],'doi'=>'10.0000/univai.2026.001','publicationDate'=>'2026-05-20','downloads'=>324,'citations'=>8]],
            ['publication','Digital Finance and Student Success','Published',['authors'=>['UnivAI Research Team'],'abstract'=>'Examining digital financial tools and student persistence.','keywords'=>['fintech','students','digital finance'],'doi'=>'10.0000/univai.2026.002','publicationDate'=>'2026-07-12','downloads'=>187,'citations'=>3]],
            ['living_lab','AI & Education Living Lab','Active',['manager'=>'Research Office','description'=>'Collaborative environment for testing AI-enabled learning interventions.','projects'=>[],'participants'=>['Students','Lecturers','Researchers']]],
            ['living_lab','Climate-Smart Campus Lab','Active',['manager'=>'Research Office','description'=>'Campus experimentation around climate and energy solutions.','projects'=>[],'participants'=>['Students','Facilities','Researchers']]],
            ['challenge','Build for Campus 2030','Active',['description'=>'Prototype a technology solution to a real university challenge.','deadline'=>'2026-09-30','prizePool'=>'K100,000','participants'=>[]]],
            ['challenge','AI for Africa Challenge','Active',['description'=>'Develop responsible AI applications with measurable social impact.','deadline'=>'2026-10-15','prizePool'=>'$25,000','participants'=>[]]],
            ['startup','StudyFlow AI','MVP',['founders'=>['UnivAI Research Team'],'industry'=>'EdTech','stage'=>'MVP','valuation'=>0,'fundingRaised'=>25000]],
        ];
        foreach ($records as [$type,$title,$status,$data]) {
            if (DB::table('research_entities')->where(['entity_type'=>$type,'title'=>$title])->exists()) continue;
            DB::table('research_entities')->insert(['id'=>(string)Str::uuid(),'entity_type'=>$type,'title'=>$title,'status'=>$status,'owner_id'=>null,'data'=>json_encode($data),'created_at'=>now(),'updated_at'=>now()]);
        }
    }
}
