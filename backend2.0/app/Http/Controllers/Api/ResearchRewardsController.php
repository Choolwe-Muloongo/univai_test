<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
class ResearchRewardsController extends Controller
{
    private const REWARDS=['publication'=>50,'participation'=>10,'challenge'=>25,'startup'=>300,'patent'=>500,'grant'=>200,'fellowship'=>100];
    public function index(){return response()->json(['balance'=>(int)DB::table('research_rewards')->where('user_id',$this->userId())->sum('aftacoin'),'rewards'=>DB::table('research_rewards')->where('user_id',$this->userId())->latest()->get()]);}
    public function award(Request $request){$d=$request->validate(['action'=>'required|string','entityId'=>'nullable|uuid','entityType'=>'nullable|string','badge'=>'nullable|string|max:120','aftacoin'=>'nullable|integer|min:1']);$amount=$d['aftacoin']??(self::REWARDS[$d['action']]??0);if(!$amount)return response()->json(['message'=>'Unknown reward action'],422);$id=DB::table('research_rewards')->insertGetId(['user_id'=>$this->userId(),'action'=>$d['action'],'aftacoin'=>$amount,'badge'=>$d['badge']??null,'entity_id'=>$d['entityId']??null,'entity_type'=>$d['entityType']??null,'created_at'=>now(),'updated_at'=>now()]);return response()->json(['id'=>$id,'aftacoin'=>$amount,'balance'=>(int)DB::table('research_rewards')->where('user_id',$this->userId())->sum('aftacoin')],201);}
    private function userId(){ $u=session('user');return is_array($u)&&isset($u['id'])?(string)$u['id']:(string)(session('user_id')??''); }
}
